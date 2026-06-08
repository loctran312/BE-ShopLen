const express = require('express');
const { register, login, logout, getCurrentUser, forgotPassword, verifyResetOtp, resetPassword, startGoogleLogin, handleGoogleCallback } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/google', startGoogleLogin);
router.get('/google/callback', handleGoogleCallback);
router.post('/logout', logout);
router.get('/me', getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;