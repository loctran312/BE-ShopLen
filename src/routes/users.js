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
	filterUsersAdmin
} = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', requireAdmin, getAllUsers);

/**
 * @swagger
 * /users/{user_id}:
 *   get:
 *     summary: Lấy chi tiết người dùng theo id
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:user_id', requireAdmin, getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tạo người dùng bằng quyền admin
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               username: newuser
 *               email: newuser@example.com
 *               password: Password@123
 *               role: customer
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', requireAdmin, createUser);

/**
 * @swagger
 * /users/{user_id}:
 *   put:
 *     summary: Cập nhật người dùng bằng quyền admin
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               username: updateduser
 *               email: updated@example.com
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:user_id', requireAdmin, updateUser);

/**
 * @swagger
 * /users/user/me:
 *   put:
 *     summary: Cập nhật thông tin người dùng hiện tại
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               username: username
 *               first_name: user
 *               last_name: name
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/user/me', updateCurrentUser);

/**
 * @swagger
 * /users/{user_id}:
 *   delete:
 *     summary: Xóa người dùng bằng quyền admin
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:user_id', requireAdmin, deleteUser);

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Đổi mật khẩu cho người dùng hiện tại
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               currentPassword: Password@123
 *               newPassword: NewPassword@123
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
router.post('/change-password', changePassword);

/**
 * @swagger
 * /users/filter:
 *   post:
 *     summary: Lọc người dùng theo nhiều tiêu chí (quyền admin)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               keyword: Nguyễn
 *               roles: [customer]
 *               page: 1
 *     responses:
 *       200:
 *         description: Lọc thành công
 */
router.post('/filter', requireAdmin, filterUsersAdmin);

module.exports = router;