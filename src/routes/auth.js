const express = require('express');
const { register, login, refreshToken, logout, getCurrentUser, forgotPassword, verifyResetOtp, resetPassword, startGoogleLogin, handleGoogleCallback } = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               username: user123
 *               email: user@example.com
 *               password: Password@123
 *               phone_number: 0901234567
 *               role: customer
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập bằng email và mật khẩu
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               email: user@example.com
 *               password: Password@123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Lấy access token mới bằng refresh token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               refresh_token: jwt-refresh-token
 *     responses:
 *       200:
 *         description: Lấy token thành công
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Bắt đầu đăng nhập bằng Google
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirect tới Google OAuth
 */
router.get('/google', startGoogleLogin);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Xử lý callback từ Google OAuth
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirect về frontend với token
 */
router.get('/google/callback', handleGoogleCallback);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất phiên hiện tại
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 */
router.get('/me', getCurrentUser);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Gửi OTP đặt lại mật khẩu
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               email: user@example.com
 *     responses:
 *       200:
 *         description: OTP đã được gửi
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/verify-reset-otp:
 *   post:
 *     summary: Xác thực OTP và lấy token phiên đặt lại
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               email: user@example.com
 *               otp: 123456
 *     responses:
 *       200:
 *         description: OTP hợp lệ
 */
router.post('/verify-reset-otp', verifyResetOtp);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng token phiên
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               email: user@example.com
 *               new_password: NewPassword@123
 *               reset_session_token: jwt-reset-session-token
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 */
router.post('/reset-password', resetPassword);

module.exports = router;