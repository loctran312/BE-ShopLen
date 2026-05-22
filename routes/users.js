const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const {
	getAllUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
	changePassword,
} = require('../controllers/userController');
const router = express.Router();

// GET - Lấy danh sách tất cả người dùng
router.get('/', requireAdmin, getAllUsers);

// GET - Lấy thông tin người dùng theo ID
router.get('/:user_id', requireAdmin, getUserById);

// POST - Tạo người dùng mới
router.post('/', requireAdmin, createUser);

// PUT - Cập nhật người dùng
router.put('/:user_id', requireAdmin, updateUser);

// DELETE - Xóa người dùng
router.delete('/:user_id', requireAdmin, deleteUser);

// POST - Đổi mật khẩu
router.post('/change-password', changePassword);

module.exports = router;
