const pool = require('../config/db');

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

module.exports = {
  getAllUsers,
  getUserById
}