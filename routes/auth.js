const express = require('express');
const { register, login, logout, getCurrentUser, forgotPassword, verifyResetOtp, resetPassword, startGoogleLogin, handleGoogleCallback } = require('../controllers/authController');

const router = express.Router();

// POST - Đăng ký người dùng mới
router.post('/register', register);

// POST - Đăng nhập người dùng
router.post('/login', login);

// GET - Bắt đầu đăng nhập Google
router.get('/google', startGoogleLogin);

// GET - Callback từ Google OAuth
router.get('/google/callback', handleGoogleCallback);

// POST - Đăng xuất người dùng
router.post('/logout', logout);

// GET - Lấy thông tin người dùng hiện tại
router.get('/me', getCurrentUser);

// POST - Yêu cầu OTP quên mật khẩu
router.post('/forgot-password', forgotPassword);

// POST - Xác minh OTP để lấy phiên reset mật khẩu
router.post('/verify-reset-otp', verifyResetOtp);

// POST - Đặt lại mật khẩu bằng OTP
router.post('/reset-password', resetPassword);

module.exports = router;
