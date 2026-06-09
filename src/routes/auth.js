const express = require('express');
const { register, login, refreshToken, logout, getCurrentUser, forgotPassword, verifyResetOtp, resetPassword, startGoogleLogin, handleGoogleCallback } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/google', startGoogleLogin);
router.get('/google/callback', handleGoogleCallback);
router.post('/logout', logout);
router.get('/me', getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;