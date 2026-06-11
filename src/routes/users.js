const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const {
	getAllUsers,
	getUserById,
	createUser,
	updateUser,
	updateCurrentUser,
	deleteUser,
	changePassword,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', requireAdmin, getAllUsers);
router.get('/:user_id', requireAdmin, getUserById);
router.post('/', requireAdmin, createUser);
router.put('/:user_id', requireAdmin, updateUser);
router.put('/user/me', updateCurrentUser);
router.delete('/:user_id', requireAdmin, deleteUser);
router.post('/change-password', changePassword);

module.exports = router;