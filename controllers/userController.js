const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const ALLOWED_ROLES = new Set(['customer', 'admin']);

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

const normalizeText = (value) => (value || '').trim();

const getNextUserId = async () => {
  const nextIdResult = await pool.query('SELECT COALESCE(MAX(user_id), 0) + 1 AS next_id FROM users');
  return nextIdResult.rows[0].next_id;
};

const isUsernameTaken = async (username, ignoreUserId = null) => {
  const query = ignoreUserId
    ? 'SELECT user_id FROM users WHERE LOWER(TRIM(username)) = LOWER(TRIM($1)) AND user_id <> $2 LIMIT 1'
    : 'SELECT user_id FROM users WHERE LOWER(TRIM(username)) = LOWER(TRIM($1)) LIMIT 1';
  const params = ignoreUserId ? [username, ignoreUserId] : [username];

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const isEmailTaken = async (email, ignoreUserId = null) => {
  const query = ignoreUserId
    ? 'SELECT user_id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) AND user_id <> $2 LIMIT 1'
    : 'SELECT user_id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1';
  const params = ignoreUserId ? [email, ignoreUserId] : [email];

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const normalizeRole = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'customer';
  }

  const role = normalizeText(String(value)).toLowerCase();
  return ALLOWED_ROLES.has(role) ? role : null;
};

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username, first_name, last_name, email, phone_number, status, role FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query('SELECT user_id, username, first_name, last_name, email, phone_number, role FROM users WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.json(result.rows[0]);
  } catch (error) {  
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

const createUser = async (req, res) => {
  try {
    const username = normalizeText(req.body.username);
    const email = normalizeText(req.body.email).toLowerCase();
    const password = req.body.password;
    const phoneNumber = normalizeText(req.body.phone_number) || null;
    const firstName = normalizeText(req.body.first_name) || null;
    const lastName = normalizeText(req.body.last_name) || null;
    const role = normalizeRole(req.body.role);

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập username, email và mật khẩu' });
    }

    if (!role) {
      return res.status(400).json({ message: 'Role không hợp lệ' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: 'Username phải có ít nhất 3 ký tự, nhỏ hơn 20 ký tự' });
    }

    if (phoneNumber) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
    }

    if (await isUsernameTaken(username)) {
      return res.status(400).json({ message: 'Username đã tồn tại' });
    }

    if (await isEmailTaken(email)) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nextId = await getNextUserId();

    const result = await pool.query(
      `INSERT INTO users (user_id, username, email, password, first_name, last_name, phone_number, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, username, first_name, last_name, email, phone_number, status, role`,
      [nextId, username, email, hashedPassword, firstName, lastName, phoneNumber, role]
    );

    return res.status(201).json({
      message: 'Tạo người dùng thành công',
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { user_id: userId } = req.params;
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({ message: 'user_id không hợp lệ' });
    }

    const currentResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [parsedUserId]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const currentUser = currentResult.rows[0];
    const username = req.body.username !== undefined ? normalizeText(req.body.username) : currentUser.username;
    const email = req.body.email !== undefined ? normalizeText(req.body.email).toLowerCase() : currentUser.email;
    const phoneNumber = req.body.phone_number !== undefined ? (normalizeText(req.body.phone_number) || null) : currentUser.phone_number;
    const firstName = req.body.first_name !== undefined ? (normalizeText(req.body.first_name) || null) : currentUser.first_name;
    const lastName = req.body.last_name !== undefined ? (normalizeText(req.body.last_name) || null) : currentUser.last_name;
    const status = req.body.status !== undefined ? normalizeText(req.body.status) : currentUser.status;
    const role = req.body.role !== undefined ? normalizeRole(req.body.role) : currentUser.role;
    const newPassword = req.body.password;

    if (!username || !email) {
      return res.status(400).json({ message: 'Username và email không được để trống' });
    }

    if (!role) {
      return res.status(400).json({ message: 'Role không hợp lệ' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: 'Username phải có ít nhất 3 ký tự, nhỏ hơn 20 ký tự' });
    }

    if (phoneNumber) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
    }

    if (newPassword && !PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
    }

    if (await isUsernameTaken(username, parsedUserId)) {
      return res.status(400).json({ message: 'Username đã tồn tại' });
    }

    if (await isEmailTaken(email, parsedUserId)) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = newPassword ? await bcrypt.hash(newPassword, 10) : currentUser.password;

    const result = await pool.query(
      `UPDATE users
       SET username = $1,
           email = $2,
           password = $3,
           first_name = $4,
           last_name = $5,
           phone_number = $6,
           status = $7,
           role = $8
       WHERE user_id = $9
       RETURNING user_id, username, first_name, last_name, email, phone_number, status, role`,
      [username, email, hashedPassword, firstName, lastName, phoneNumber, status, role, parsedUserId]
    );

    return res.json({
      message: 'Cập nhật người dùng thành công',
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { user_id: userId } = req.params;
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({ message: 'user_id không hợp lệ' });
    }

    const currentResult = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [parsedUserId]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    await pool.query('DELETE FROM users WHERE user_id = $1', [parsedUserId]);

    return res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
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

    const user_id = decoded.user_id;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu' });
    }

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu trùng nhau
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới và xác nhận mật khẩu không trùng nhau' });
    }

    // Kiểm tra mật khẩu mới không được trùng với mật khẩu hiện tại
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' });
    }

    // Validate mật khẩu mới (ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' });
    }

    // Lấy mật khẩu hiện tại của người dùng từ cơ sở dữ liệu
    const userResult = await pool.query('SELECT password FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const user = userResult.rows[0];

    // So sánh mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    // Mã hóa mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới
    await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedNewPassword, user_id]);

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword
}