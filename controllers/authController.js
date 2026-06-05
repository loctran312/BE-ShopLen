const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomInt } = require('crypto');
const { sendOtpNotification } = require('../services/otpService');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const OTP_EXPIRY_MINUTES = Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10);
const RESET_SESSION_EXPIRES_IN = process.env.PASSWORD_RESET_SESSION_EXPIRES_IN || '15m';
const RESET_CHANNEL = 'email';
const GOOGLE_AUTH_SCOPE = 'openid email profile';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_TOKEN_INFO_ENDPOINT = 'https://oauth2.googleapis.com/tokeninfo';
const GOOGLE_OAUTH_STATE_EXPIRES_IN = process.env.GOOGLE_OAUTH_STATE_EXPIRES_IN || '10m';
const envTrim = (value) => (value || '').trim();
const GOOGLE_CLIENT_ID = envTrim(process.env.GOOGLE_CLIENT_ID);
const GOOGLE_CLIENT_SECRET = envTrim(process.env.GOOGLE_CLIENT_SECRET);
const GOOGLE_REDIRECT_URI = envTrim(process.env.GOOGLE_REDIRECT_URI) || `http://localhost:${process.env.PORT || 3000}/api/auth/google/callback`;
const GOOGLE_FRONTEND_REDIRECT_URI = envTrim(process.env.GOOGLE_FRONTEND_REDIRECT_URI) || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

const normalizeIdentifier = (value) => (value || '').trim();

// Shared utility to extract and verify Bearer token
const extractAndVerifyToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid token format');
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token không hợp lệ hoặc hết hạn');
  }
};

const getUserByEmail = async (client, email) => client.query(
  `SELECT nguoi_dung_id AS user_id,
          ten_dang_nhap AS username,
          thu_dien_tu AS email,
          so_dien_thoai AS phone_number,
          vai_tro AS role,
          ho AS first_name,
          ten AS last_name
   FROM nguoi_dung
   WHERE thu_dien_tu = $1`,
  [email]
);

const createPasswordResetToken = async (client, userId, channel, destination, otpHash) => {
  const result = await client.query(
    `INSERT INTO ma_dat_lai_mat_khau (nguoi_dung_id, kenh, dia_chi_nhan, ma_otp_hash, het_han_luc)
     VALUES ($1, $2, $3, $4, NOW() + ($5 || ' minutes')::interval)
     RETURNING ma_id AS id, het_han_luc AS expires_at, ngay_tao AS created_at`,
    [userId, channel, destination, otpHash, OTP_EXPIRY_MINUTES]
  );

  return result.rows[0];
};

const getLatestResetToken = async (client, userId, channel, destination) => client.query(
  `SELECT ma_id AS id,
          ma_otp_hash AS otp_hash,
          het_han_luc AS expires_at,
          da_su_dung_luc AS used_at,
          so_lan_thu AS attempt_count,
          (het_han_luc > NOW()) AS not_expired
   FROM ma_dat_lai_mat_khau
   WHERE nguoi_dung_id = $1 AND kenh = $2 AND dia_chi_nhan = $3
   ORDER BY ma_id DESC
   LIMIT 1`,
  [userId, channel, destination]
);

const getUserById = async (client, userId) => client.query(
  `SELECT nguoi_dung_id AS user_id,
          ten_dang_nhap AS username,
          thu_dien_tu AS email,
          so_dien_thoai AS phone_number,
          vai_tro AS role,
          ho AS first_name,
          ten AS last_name
   FROM nguoi_dung
   WHERE nguoi_dung_id = $1`,
  [userId]
);

const getUserByGoogleProviderId = async (client, providerId) => client.query(
  `SELECT u.nguoi_dung_id AS user_id,
          u.ten_dang_nhap AS username,
          u.thu_dien_tu AS email,
          u.so_dien_thoai AS phone_number,
          u.vai_tro AS role,
          u.ho AS first_name,
          u.ten AS last_name
   FROM nguoi_dung_xac_thuc ap
   INNER JOIN nguoi_dung u ON u.nguoi_dung_id = ap.nguoi_dung_id
   WHERE ap.nha_cung_cap = 'google' AND ap.nha_cung_cap_id = $1
   LIMIT 1`,
  [providerId]
);

const getGoogleProviderByUserId = async (client, userId) => client.query(
  `SELECT xac_thuc_id AS id,
          nguoi_dung_id AS user_id,
          nha_cung_cap AS provider,
          nha_cung_cap_id AS provider_id
   FROM nguoi_dung_xac_thuc
   WHERE nguoi_dung_id = $1 AND nha_cung_cap = 'google'
   LIMIT 1`,
  [userId]
);

const getNextUserId = async (client) => {
  const nextIdResult = await client.query(`
    SELECT COALESCE(MAX(nguoi_dung_id), 0) + 1 as next_id FROM nguoi_dung
  `);

  return nextIdResult.rows[0].next_id;
};

const buildGoogleFrontendRedirectUrl = (params) => {
  const url = new URL(GOOGLE_FRONTEND_REDIRECT_URI);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const buildGoogleOAuthUrl = (state) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  url.search = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_AUTH_SCOPE,
    access_type: 'online',
    prompt: 'select_account',
    include_granted_scopes: 'true',
    state,
  }).toString();

  return url.toString();
};

const createGoogleStateToken = (redirectTo) => jwt.sign(
  {
    purpose: 'google_oauth_state',
    redirect_to: redirectTo || GOOGLE_FRONTEND_REDIRECT_URI,
  },
  process.env.JWT_SECRET,
  { expiresIn: GOOGLE_OAUTH_STATE_EXPIRES_IN }
);

const verifyGoogleStateToken = (state) => {
  const decoded = jwt.verify(state, process.env.JWT_SECRET);

  if (decoded.purpose !== 'google_oauth_state') {
    throw new Error('State không hợp lệ');
  }

  return decoded;
};

const fetchGoogleTokenPayload = async (code) => {
  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();

  if (!tokenData.id_token) {
    throw new Error('Thiếu id_token từ Google');
  }

  const tokenInfoResponse = await fetch(`${GOOGLE_TOKEN_INFO_ENDPOINT}?id_token=${encodeURIComponent(tokenData.id_token)}`);

  if (!tokenInfoResponse.ok) {
    const errorText = await tokenInfoResponse.text();
    throw new Error(`Google id_token verification failed: ${errorText}`);
  }

  const tokenInfo = await tokenInfoResponse.json();

  if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
    throw new Error('Google audience không khớp');
  }

  if (tokenInfo.iss !== 'https://accounts.google.com' && tokenInfo.iss !== 'accounts.google.com') {
    throw new Error('Google issuer không hợp lệ');
  }

  if (!tokenInfo.email || (tokenInfo.email_verified !== true && tokenInfo.email_verified !== 'true')) {
    throw new Error('Google email chưa được xác minh');
  }

  return tokenInfo;
};

const generateGoogleUsername = (email, googleSub) => {
  const emailPrefix = normalizeIdentifier(email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');
  const safePrefix = (emailPrefix || 'google').slice(0, 8);
  const suffix = String(googleSub).slice(0, 12);

  return `${safePrefix}_${suffix}`.slice(0, 20);
};

const ensureUniqueUsername = async (client, usernameCandidate) => {
  const existingResult = await client.query('SELECT nguoi_dung_id FROM nguoi_dung WHERE ten_dang_nhap = $1 LIMIT 1', [usernameCandidate]);

  if (existingResult.rows.length === 0) {
    return usernameCandidate;
  }

  const fallback = `${usernameCandidate.slice(0, 17)}_${randomInt(100, 999)}`.slice(0, 20);
  const fallbackResult = await client.query('SELECT nguoi_dung_id FROM nguoi_dung WHERE ten_dang_nhap = $1 LIMIT 1', [fallback]);

  if (fallbackResult.rows.length === 0) {
    return fallback;
  }

  return `${usernameCandidate.slice(0, 15)}_${Date.now().toString().slice(-4)}`.slice(0, 20);
};

const issueAuthToken = (user) => jwt.sign(
  { user_id: user.user_id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const createOrLinkGoogleUser = async (client, googleProfile) => {
  const existingGoogleUserResult = await getUserByGoogleProviderId(client, googleProfile.sub);

  if (existingGoogleUserResult.rows.length > 0) {
    return existingGoogleUserResult.rows[0];
  }

  const existingUserResult = await getUserByEmail(client, googleProfile.email);

  if (existingUserResult.rows.length > 0) {
    const existingUser = existingUserResult.rows[0];
    const existingProviderResult = await getGoogleProviderByUserId(client, existingUser.user_id);

    if (existingProviderResult.rows.length === 0) {
      await client.query(
        'INSERT INTO nguoi_dung_xac_thuc (nguoi_dung_id, nha_cung_cap, nha_cung_cap_id) VALUES ($1, $2, $3)',
        [existingUser.user_id, 'google', googleProfile.sub]
      );
    }

    return existingUser;
  }

  const nextId = await getNextUserId(client);
  const usernameCandidate = await ensureUniqueUsername(client, generateGoogleUsername(googleProfile.email, googleProfile.sub));

  const newUserResult = await client.query(
    `INSERT INTO nguoi_dung (nguoi_dung_id, ten_dang_nhap, thu_dien_tu, mat_khau, so_dien_thoai, vai_tro)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING nguoi_dung_id AS user_id,
               ten_dang_nhap AS username,
               thu_dien_tu AS email,
               so_dien_thoai AS phone_number,
               vai_tro AS role,
               ho AS first_name,
               ten AS last_name`,
    [nextId, usernameCandidate, googleProfile.email, null, null, 'customer']
  );

  const newUser = newUserResult.rows[0];

  await client.query(
    'INSERT INTO nguoi_dung_xac_thuc (nguoi_dung_id, nha_cung_cap, nha_cung_cap_id) VALUES ($1, $2, $3)',
    [newUser.user_id, 'google', googleProfile.sub]
  );

  return newUser;
};

// Đăng ký người dùng mới
const register = async (req, res) => {
  try {
    const { username, email, password, phone_number, role } = req.body;

    // Kiểm tra username hoặc email đã tồn tại chưa
    const existingUser = await pool.query(
      'SELECT * FROM nguoi_dung WHERE ten_dang_nhap = $1 OR thu_dien_tu = $2', [username, email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username hoặc email đã tồn tại' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    // Validate usernaame (ít nhất 3 ký tự, nhỏ hơn 20 ký tự)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: 'Username phải có ít nhất 3 ký tự, nhỏ hơn 20 ký tự' });
    }

    // Validate phone number (10 số, bắt đầu bằng 0)
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    // Validate password (ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
    }
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lấy ID tiếp theo (MAX + 1), nếu không có user thì bắt đầu từ 1
    const nextIdResult = await pool.query(`
      SELECT COALESCE(MAX(nguoi_dung_id), 0) + 1 as next_id FROM nguoi_dung
    `);
    const nextId = nextIdResult.rows[0].next_id;

    // Thêm người dùng mới vào cơ sở dữ liệu
    const newUser = await pool.query(
      'INSERT INTO nguoi_dung (nguoi_dung_id, ten_dang_nhap, thu_dien_tu, mat_khau, so_dien_thoai, vai_tro) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nextId, username, email, hashedPassword, phone_number, role]
    );

    res.status(201).json({ message: 'Đăng ký thành công'});
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

const startGoogleLogin = async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ message: 'Thiếu cấu hình Google OAuth' });
    }

    const redirectTo = normalizeIdentifier(req.query.redirect_to) || GOOGLE_FRONTEND_REDIRECT_URI;
    const state = createGoogleStateToken(redirectTo);
    const googleOAuthUrl = buildGoogleOAuthUrl(state);

    console.log('[AUTH][GOOGLE_START] redirect_uri =', GOOGLE_REDIRECT_URI);
    console.log('[AUTH][GOOGLE_START] auth_url =', googleOAuthUrl);

    return res.redirect(googleOAuthUrl);
  } catch (error) {
    return res.status(500).json({ message: 'Không thể bắt đầu đăng nhập Google' });
  }
};

const handleGoogleCallback = async (req, res) => {
  const client = await pool.connect();

  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      return res.redirect(buildGoogleFrontendRedirectUrl({
        error: 'google_login_failed',
        message: errorDescription || error,
      }));
    }

    if (!code || !state) {
      return res.status(400).json({ message: 'Thiếu code hoặc state từ Google' });
    }

    let statePayload;

    try {
      statePayload = verifyGoogleStateToken(state);
    } catch (verificationError) {
      return res.redirect(buildGoogleFrontendRedirectUrl({
        error: 'invalid_google_state',
        message: verificationError.message,
      }));
    }

    const googleProfile = await fetchGoogleTokenPayload(code);

    await client.query('BEGIN');

    const user = await createOrLinkGoogleUser(client, googleProfile);
    await pool.query('UPDATE nguoi_dung SET trang_thai = $1 WHERE nguoi_dung_id = $2', ['active', user.user_id]);
    const token = issueAuthToken(user);

    await client.query('COMMIT');

    return res.redirect(buildGoogleFrontendRedirectUrl({
      token,
      role: user.role,
      user_id: user.user_id,
      redirect_to: statePayload.redirect_to || GOOGLE_FRONTEND_REDIRECT_URI,
    }));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[AUTH][GOOGLE_CALLBACK] Error:', error.message);

    return res.redirect(buildGoogleFrontendRedirectUrl({
      error: 'google_login_failed',
      message: 'Đăng nhập Google thất bại',
    }));
  } finally {
    client.release();
  }
};

// Đăng nhập người dùng
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra email có tồn tại không
    const userResult = await pool.query('SELECT * FROM nguoi_dung WHERE thu_dien_tu = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = userResult.rows[0];

    // So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    await pool.query('UPDATE nguoi_dung SET trang_thai = $1 WHERE nguoi_dung_id = $2', ['active', user.user_id]);

    // Tạo token JWT
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json(
      { 
        "token": token,
        "user": {
          "user_id": user.user_id,
          "role": user.role
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// Đăng xuất người dùng
const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' });
    }

    let decoded;
    try {
      decoded = extractAndVerifyToken(authHeader);
    } catch (error) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' });
    }

    await pool.query('UPDATE nguoi_dung SET trang_thai = $1 WHERE nguoi_dung_id = $2', ['inactive', decoded.user_id]);

    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// Lấy thông tin người dùng hiện tại
const getCurrentUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' });
        }
        
        let decoded;
        try {
            decoded = extractAndVerifyToken(authHeader);
        } catch (error) {
            return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' });
        }

        const userResult = await pool.query(
          `SELECT nguoi_dung_id AS user_id,
                  ten_dang_nhap AS username,
                  thu_dien_tu AS email,
                  so_dien_thoai AS phone_number,
                  vai_tro AS role,
                  ho AS first_name,
                  ten AS last_name
           FROM nguoi_dung
           WHERE nguoi_dung_id = $1`,
          [decoded.user_id]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        res.json(userResult.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
}

// Quên mật khẩu qua email
const forgotPassword = async (req, res) => {
  const client = await pool.connect();

  try {
    const identifier = normalizeIdentifier(req.body.identifier || req.body.email);

    if (!identifier) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    const userResult = await getUserByEmail(client, identifier);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const user = userResult.rows[0];
    const destination = user.email;

    if (!destination) {
      return res.status(400).json({ message: 'Người dùng chưa có thông tin nhận OTP' });
    }

    const otp = String(randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 10);

    await client.query('BEGIN');
    await client.query(
      'UPDATE ma_dat_lai_mat_khau SET da_su_dung_luc = NOW() WHERE nguoi_dung_id = $1 AND kenh = $2 AND da_su_dung_luc IS NULL',
      [user.user_id, RESET_CHANNEL]
    );

    const resetToken = await createPasswordResetToken(client, user.user_id, RESET_CHANNEL, destination, otpHash);

    await sendOtpNotification({
      channel: 'email',
      destination,
      otp,
      username: user.username,
    });

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Mã OTP đã được gửi',
      reset_token_id: resetToken.id,
      expires_at: resetToken.expires_at,
      // ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[AUTH][FORGOT_PASSWORD] Error:', error.message);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
}

const verifyResetOtp = async (req, res) => {
  const client = await pool.connect();

  try {
    const identifier = normalizeIdentifier(req.body.identifier || req.body.email);
    const otp = normalizeIdentifier(req.body.otp);

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Thiếu email hoặc OTP' });
    }

    const userResult = await getUserByEmail(client, identifier);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const user = userResult.rows[0];
    const destination = user.email;

    await client.query('BEGIN');

    const tokenResult = await getLatestResetToken(client, user.user_id, RESET_CHANNEL, destination);

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    const token = tokenResult.rows[0];

    if (token.used_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'OTP đã được sử dụng' });
    }

    if (!token.not_expired) {
      await client.query('UPDATE ma_dat_lai_mat_khau SET so_lan_thu = so_lan_thu + 1 WHERE ma_id = $1', [token.id]);
      await client.query('COMMIT');
      return res.status(400).json({ message: 'OTP đã hết hạn' });
    }

    const isOtpValid = await bcrypt.compare(otp, token.otp_hash);
    if (!isOtpValid) {
      await client.query('UPDATE ma_dat_lai_mat_khau SET so_lan_thu = so_lan_thu + 1 WHERE ma_id = $1', [token.id]);
      await client.query('COMMIT');
      return res.status(400).json({ message: 'OTP không đúng' });
    }

    const resetSessionToken = jwt.sign(
      {
        purpose: 'password_reset',
        user_id: user.user_id,
        reset_token_id: token.id,
        channel: RESET_CHANNEL,
        destination,
      },
      process.env.JWT_SECRET,
      { expiresIn: RESET_SESSION_EXPIRES_IN }
    );

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'OTP hợp lệ',
      reset_session_token: resetSessionToken,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[AUTH][VERIFY_RESET_OTP] Error:', error.message);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
};

const resetPassword = async (req, res) => {
  const client = await pool.connect();

  try {
    const identifier = normalizeIdentifier(req.body.identifier || req.body.email);
    const newPassword = req.body.new_password;
    const resetSessionToken = normalizeIdentifier(req.body.reset_session_token);

    if (!identifier || !newPassword || !resetSessionToken) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt lại mật khẩu' });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
    }

    const userResult = await getUserByEmail(client, identifier);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const user = userResult.rows[0];
    const destination = user.email;

    let decodedResetToken;
    try {
      decodedResetToken = jwt.verify(resetSessionToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }

    if (
      decodedResetToken.purpose !== 'password_reset' ||
      decodedResetToken.user_id !== user.user_id ||
      decodedResetToken.channel !== RESET_CHANNEL ||
      decodedResetToken.destination !== destination
    ) {
      return res.status(400).json({ message: 'Phiên đặt lại mật khẩu không hợp lệ' });
    }

    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT id, used_at, (expires_at > NOW()) AS not_expired
       FROM ma_dat_lai_mat_khau
       WHERE ma_id = $1 AND nguoi_dung_id = $2 AND kenh = $3 AND dia_chi_nhan = $4
       LIMIT 1`,
      [decodedResetToken.reset_token_id, user.user_id, RESET_CHANNEL, destination]
    );

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    const token = tokenResult.rows[0];

    if (token.used_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'OTP đã được sử dụng' });
    }

    if (!token.not_expired) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'OTP đã hết hạn' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await client.query('UPDATE nguoi_dung SET mat_khau = $1 WHERE nguoi_dung_id = $2', [hashedPassword, user.user_id]);
    await client.query('UPDATE ma_dat_lai_mat_khau SET da_su_dung_luc = NOW() WHERE ma_id = $1', [token.id]);

    await client.query('COMMIT');

    return res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[AUTH][RESET_PASSWORD] Error:', error.message);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  } finally {
    client.release();
  }
};

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    startGoogleLogin,
    handleGoogleCallback
};