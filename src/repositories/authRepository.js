const pool = require('../config/db');

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

const createUser = async (client, { userId, username, email, password, phoneNumber, role }) => client.query(
  `INSERT INTO nguoi_dung (nguoi_dung_id, ten_dang_nhap, thu_dien_tu, mat_khau, so_dien_thoai, vai_tro)
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING nguoi_dung_id AS user_id,
             ten_dang_nhap AS username,
             thu_dien_tu AS email,
             so_dien_thoai AS phone_number,
             vai_tro AS role,
             ho AS first_name,
             ten AS last_name`,
  [userId, username, email, password, phoneNumber, role]
);

const createGoogleProvider = async (client, userId, providerId) => client.query(
  'INSERT INTO nguoi_dung_xac_thuc (nguoi_dung_id, nha_cung_cap, nha_cung_cap_id) VALUES ($1, $2, $3)',
  [userId, 'google', providerId]
);

const getUserByUsernameOrEmail = async (username, email) => pool.query(
  'SELECT * FROM nguoi_dung WHERE ten_dang_nhap = $1 OR thu_dien_tu = $2',
  [username, email]
);

const getUserWithPassword = async (email) => pool.query(
  `SELECT nguoi_dung_id AS user_id,
          ten_dang_nhap AS username,
          thu_dien_tu AS email,
          mat_khau AS password,
          vai_tro AS role
   FROM nguoi_dung
   WHERE thu_dien_tu = $1
   LIMIT 1`,
  [email]
);

const updateUserStatus = async (userId, status) => pool.query(
  'UPDATE nguoi_dung SET trang_thai = $1 WHERE nguoi_dung_id = $2',
  [status, userId]
);

const getUserByRefreshToken = async (refreshToken) => pool.query(
  `SELECT nguoi_dung_id AS user_id,
          ten_dang_nhap AS username,
          thu_dien_tu AS email,
          so_dien_thoai AS phone_number,
          vai_tro AS role,
          ho AS first_name,
          ten AS last_name
   FROM nguoi_dung
   WHERE refresh_token = $1
   LIMIT 1`,
  [refreshToken]
);

const updateRefreshToken = async (userId, refreshToken) => pool.query(
  'UPDATE nguoi_dung SET refresh_token = $1 WHERE nguoi_dung_id = $2',
  [refreshToken, userId]
);

const clearRefreshToken = async (userId) => pool.query(
  'UPDATE nguoi_dung SET refresh_token = NULL WHERE nguoi_dung_id = $1',
  [userId]
);

const markActiveResetTokensUsed = async (client, userId, channel) => client.query(
  'UPDATE ma_dat_lai_mat_khau SET da_su_dung_luc = NOW() WHERE nguoi_dung_id = $1 AND kenh = $2 AND da_su_dung_luc IS NULL',
  [userId, channel]
);

const createPasswordResetToken = async (client, userId, channel, destination, otpHash) => {
  const result = await client.query(
    `INSERT INTO ma_dat_lai_mat_khau (nguoi_dung_id, kenh, dia_chi_nhan, ma_otp_hash, het_han_luc)
     VALUES ($1, $2, $3, $4, NOW() + ($5 || ' minutes')::interval)
     RETURNING ma_id AS id, het_han_luc AS expires_at, ngay_tao AS created_at`,
    [userId, channel, destination, otpHash, Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10)]
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

const getPasswordResetToken = async (client, tokenId, userId, channel, destination) => client.query(
  `SELECT ma_id AS id,
          da_su_dung_luc AS used_at,
          (het_han_luc > NOW()) AS not_expired
   FROM ma_dat_lai_mat_khau
   WHERE ma_id = $1 AND nguoi_dung_id = $2 AND kenh = $3 AND dia_chi_nhan = $4
   LIMIT 1`,
  [tokenId, userId, channel, destination]
);

const updateUserPassword = async (client, userId, hashedPassword) => client.query(
  'UPDATE nguoi_dung SET mat_khau = $1 WHERE nguoi_dung_id = $2',
  [hashedPassword, userId]
);

const markPasswordResetTokenUsed = async (client, tokenId) => client.query(
  'UPDATE ma_dat_lai_mat_khau SET da_su_dung_luc = NOW() WHERE ma_id = $1',
  [tokenId]
);

const incrementResetTokenAttempts = async (client, tokenId) => client.query(
  'UPDATE ma_dat_lai_mat_khau SET so_lan_thu = so_lan_thu + 1 WHERE ma_id = $1',
  [tokenId]
);

module.exports = {
  getUserByEmail,
  getUserById,
  getUserByGoogleProviderId,
  getGoogleProviderByUserId,
  getNextUserId,
  createUser,
  createGoogleProvider,
  getUserByUsernameOrEmail,
  getUserWithPassword,
  getUserByRefreshToken,
  updateUserStatus,
  updateRefreshToken,
  clearRefreshToken,
  markActiveResetTokensUsed,
  createPasswordResetToken,
  getLatestResetToken,
  getPasswordResetToken,
  updateUserPassword,
  markPasswordResetTokenUsed,
  incrementResetTokenAttempts,
};
