const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { parsePositiveInteger } = require('../utils/pagination');

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

const normalizeRole = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'customer';
  }

  const role = normalizeText(String(value)).toLowerCase();
  return ALLOWED_ROLES.has(role) ? role : null;
};

const getAllUsers = async (req, res) => {
  try {
    const rawPage = req.query.page !== undefined
      ? req.query.page
      : (req.body && req.body.page !== undefined ? req.body.page : 1);

    const rawLimit = req.query.limit !== undefined
      ? req.query.limit
      : (req.body && req.body.limit !== undefined ? req.body.limit : 10);

    const page = parsePositiveInteger(rawPage, 'page');
    const limit = parsePositiveInteger(rawLimit, 'limit');

    const { users, pagination } = await userRepository.getAllUsers({ page, limit });

    return res.json({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: {
        users,
        pagination,
      },
    });
  } catch (error) {
    if (error.message && (error.message === 'page không hợp lệ' || error.message === 'limit không hợp lệ')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await userRepository.getUserById(Number(user_id));
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

    if (await userRepository.isUsernameTaken(username)) {
      return res.status(400).json({ message: 'Username đã tồn tại' });
    }

    if (await userRepository.isEmailTaken(email)) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await userRepository.createUser({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role,
    });

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

    const currentResult = await userRepository.getUserById(parsedUserId);

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

    if (await userRepository.isUsernameTaken(username, parsedUserId)) {
      return res.status(400).json({ message: 'Username đã tồn tại' });
    }

    if (await userRepository.isEmailTaken(email, parsedUserId)) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = newPassword ? await bcrypt.hash(newPassword, 10) : currentUser.password;

    const result = await userRepository.updateUser(parsedUserId, {
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      status,
      role,
    });

    return res.json({
      message: 'Cập nhật người dùng thành công',
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'Token không hợp lệ hoặc hết hạn'
      });
    }

    let decoded;

    try {
      decoded = extractAndVerifyToken(authHeader);
    } catch {
      return res.status(401).json({
        message: 'Token không hợp lệ hoặc hết hạn'
      });
    }

    const userId = decoded.user_id;

    const currentResult = await userRepository.getUserById(userId);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const currentUser = currentResult.rows[0];

    const username =
      req.body.username !== undefined
        ? normalizeText(req.body.username)
        : currentUser.username;

    const email =
      req.body.email !== undefined
        ? normalizeText(req.body.email).toLowerCase()
        : currentUser.email;

    const firstName =
      req.body.first_name !== undefined
        ? normalizeText(req.body.first_name) || null
        : currentUser.first_name;

    const lastName =
      req.body.last_name !== undefined
        ? normalizeText(req.body.last_name) || null
        : currentUser.last_name;

    const phoneNumber =
      req.body.phone_number !== undefined
        ? normalizeText(req.body.phone_number) || null
        : currentUser.phone_number;

    if (!username || !email) {
      return res.status(400).json({
        message: 'Username và email không được để trống'
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          'Username phải có ít nhất 3 ký tự, nhỏ hơn 20 ký tự'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Email không hợp lệ'
      });
    }

    if (phoneNumber) {
      const phoneRegex = /^0\d{9}$/;

      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          message: 'Số điện thoại không hợp lệ'
        });
      }
    }

    if (await userRepository.isUsernameTaken(username, userId)) {
      return res.status(400).json({
        message: 'Username đã tồn tại'
      });
    }

    if (await userRepository.isEmailTaken(email, userId)) {
      return res.status(400).json({
        message: 'Email đã tồn tại'
      });
    }

    const result = await userRepository.updateCurrentUser(
      userId,
      {
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
      }
    );

    return res.json({
      message: 'Cập nhật thông tin thành công',
      user: result.rows[0]
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: 'Lỗi máy chủ'
    });
  }
};
  
const deleteUser = async (req, res) => {
  try {
    const { user_id: userId } = req.params;
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({ message: 'user_id không hợp lệ' });
    }

    const currentResult = await userRepository.getUserById(parsedUserId);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    await userRepository.deleteUser(parsedUserId);

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
    const userResult = await userRepository.getPasswordByUserId(user_id);
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
    await userRepository.updateUserPassword(user_id, hashedNewPassword);

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

const filterUsersAdmin = async (req, res) => {
    try {
        const page = parsePositiveInteger(req.body.page || 1, 'page');
        const limit = parsePositiveInteger(req.body.limit || 10, 'limit');
        
        const result = await userRepository.filterUsersAdmin({
            page, limit,
            keyword: req.body.keyword,
            roles: req.body.roles,
            statuses: req.body.statuses
        });

        return res.json({ success: true, message: 'Lọc người dùng thành công', data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateCurrentUser,
  deleteUser,
  changePassword,
  filterUsersAdmin,
}