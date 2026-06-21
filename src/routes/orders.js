const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { 
	createOrder, 
	getMyOrders, 
	getMyOrderDetail, 
	repurchaseOrder,
	getAllOrdersAdmin, 
	getOrderDetailAdmin, 
	updateOrderStatus,
	filterOrdersAdmin,
} = require('../controllers/orderController');

const router = express.Router();

// --- PUBLIC ROUTES (USER) ---
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', requireAuth, createOrder);

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Lấy đơn hàng của người dùng hiện tại
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/my-orders', requireAuth, getMyOrders);

/**
 * @swagger
 * /orders/my-orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng của người dùng
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/my-orders/:id', requireAuth, getMyOrderDetail);

/**
 * @swagger
 * /orders/repurchase/{id}:
 *   post:
 *     summary: Mua lại đơn hàng trước đó
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/repurchase/:id', requireAuth, repurchaseOrder);

// --- ADMIN ROUTES ---

/**
 * @swagger
 * /orders/admin/all:
 *   get:
 *     summary: Lấy tất cả đơn hàng (Admin)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/admin/all', requireAdmin, getAllOrdersAdmin);

/**
 * @swagger
 * /orders/admin/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng (Admin)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/admin/:id', requireAdmin, getOrderDetailAdmin);

/**
 * @swagger
 * /orders/admin/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng (Admin)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/admin/:id/status', requireAdmin, updateOrderStatus);

/**
 * @swagger
 * /orders/admin/filter:
 *   post:
 *     summary: Lọc đơn hàng (Admin)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/admin/filter', requireAdmin, filterOrdersAdmin);

module.exports = router;