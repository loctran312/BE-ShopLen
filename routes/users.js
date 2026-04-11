const express = require('express');
const { getAllUsers, getUserById } = require('../controllers/userController');
const router = express.Router();

// GET - Lấy danh sách tất cả người dùng
router.get('/', getAllUsers);

// GET - Lấy thông tin người dùng theo ID
router.get('/:user_id', getUserById);

module.exports = router;
