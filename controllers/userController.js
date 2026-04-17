const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

// Lấy danh sách tất cả người dùng
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username, email, phone_number, role FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query('SELECT user_id, username, email, phone_number, role FROM users WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.json(result.rows[0]);
  } catch (error) {  
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

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
  changePassword
}