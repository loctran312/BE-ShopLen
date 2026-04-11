const express = require('express');
const { register, login, logout, getCurrentUser } = require('../controllers/authController');

const router = express.Router();

// POST - Đăng ký người dùng mới
router.post('/register', register);

// POST - Đăng nhập người dùng
router.post('/login', login);

// POST - Đăng xuất người dùng
router.post('/logout', logout);

// GET - Lấy thông tin người dùng hiện tại
router.get('/me', getCurrentUser);

module.exports = router;
