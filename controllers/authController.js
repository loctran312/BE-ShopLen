const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomInt } = require('crypto');
const { sendOtpNotification } = require('../services/otpService');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const OTP_EXPIRY_MINUTES = Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10);
const RESET_SESSION_EXPIRES_IN = process.env.PASSWORD_RESET_SESSION_EXPIRES_IN || '15m';
const RESET_CHANNEL = 'email';

const normalizeIdentifier = (value) => (value || '').trim();

const getUserByEmail = async (client, email) => client.query(
  'SELECT user_id, username, email FROM users WHERE email = $1',
  [email]
);

const createPasswordResetToken = async (client, userId, channel, destination, otpHash) => {
  const result = await client.query(
    `INSERT INTO password_reset_tokens (user_id, channel, destination, otp_hash, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + ($5 || ' minutes')::interval)
     RETURNING id, expires_at, created_at`,
    [userId, channel, destination, otpHash, OTP_EXPIRY_MINUTES]
  );

  return result.rows[0];
};

const getLatestResetToken = async (client, userId, channel, destination) => client.query(
  `SELECT id, otp_hash, expires_at, used_at, attempt_count, (expires_at > NOW()) AS not_expired
   FROM password_reset_tokens
   WHERE user_id = $1 AND channel = $2 AND destination = $3
   ORDER BY id DESC
   LIMIT 1`,
  [userId, channel, destination]
);

// Đăng ký người dùng mới
const register = async (req, res) => {
  try {
    const { username, email, password, phone_number, role } = req.body;

    // Kiểm tra username hoặc email đã tồn tại chưa
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]
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
      SELECT COALESCE(MAX(user_id), 0) + 1 as next_id FROM users
    `);
    const nextId = nextIdResult.rows[0].next_id;

    // Thêm người dùng mới vào cơ sở dữ liệu
    const newUser = await pool.query(
      'INSERT INTO users (user_id, username, email, password, phone_number, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nextId, username, email, hashedPassword, phone_number, role]
    );

    res.status(201).json({ message: 'Đăng ký thành công'});
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// Đăng nhập người dùng
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra email có tồn tại không
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Email không tồn tại' });
    }

    const user = userResult.rows[0];

    // So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mật khẩu không đúng' });
    }

    // Tạo token JWT
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// Đăng xuất người dùng
const logout = (req, res) => {
    res.json({ message: 'Đăng xuất thành công' });
}

// Lấy thông tin người dùng hiện tại
const getCurrentUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Không có token' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userResult = await pool.query('SELECT user_id, username, email, phone_number, role, first_name, last_name FROM users WHERE user_id = $1', [decoded.user_id]);
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
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND channel = $2 AND used_at IS NULL',
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
      ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
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
      await client.query('UPDATE password_reset_tokens SET attempt_count = attempt_count + 1 WHERE id = $1', [token.id]);
      await client.query('COMMIT');
      return res.status(400).json({ message: 'OTP đã hết hạn' });
    }

    const isOtpValid = await bcrypt.compare(otp, token.otp_hash);
    if (!isOtpValid) {
      await client.query('UPDATE password_reset_tokens SET attempt_count = attempt_count + 1 WHERE id = $1', [token.id]);
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
      return res.status(400).json({ message: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
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
       FROM password_reset_tokens
       WHERE id = $1 AND user_id = $2 AND channel = $3 AND destination = $4
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

    await client.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, user.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [token.id]);

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
    resetPassword
}