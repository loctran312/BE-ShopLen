const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
      { expiresIn: '1h' }
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

module.exports = {
    register,
    login,
    logout,
    getCurrentUser
}