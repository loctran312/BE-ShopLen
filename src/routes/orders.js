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
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               phuong_xa_id: 1
 *               dia_chi_giao_hang: "Quận 8, TP.HCM"
 *               ten_nguoi_nhan: "Người Nhận 1"
 *               sdt_nguoi_nhan: "0987654321"
 *               phieu_giam_gia_code: "WELCOME10"
 *               phuong_thuc_thanh_toan: "COD"
 *     responses:
 *       201:
 *         description: Đặt hàng thành công
 */
router.post('/', requireAuth, createOrder);

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Lịch sử mua hàng cá nhân
 *     tags: [Orders]
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
 *         description: Lấy lịch sử đơn hàng thành công
 */
router.get('/my-orders', requireAuth, getMyOrders);

/**
 * @swagger
 * /orders/my-orders/{id}:
 *   get:
 *     summary: Chi tiết đơn hàng cá nhân
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy chi tiết đơn hàng thành công
 */
router.get('/my-orders/:id', requireAuth, getMyOrderDetail);

/**
 * @swagger
 * /orders/repurchase/{id}:
 *   post:
 *     summary: Mua lại đơn hàng cũ
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã thêm các sản phẩm cũ vào giỏ hàng
 */
router.post('/repurchase/:id', requireAuth, repurchaseOrder);

// --- ADMIN ROUTES ---

/**
 * @swagger
 * /orders/admin/all:
 *   get:
 *     summary: Lấy tất cả đơn hàng - ADMIN
 *     tags: [Orders]
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
 *         description: Lấy danh sách đơn hàng thành công
 */
router.get('/admin/all', requireAdmin, getAllOrdersAdmin);

/**
 * @swagger
 * /orders/admin/{id}:
 *   get:
 *     summary: Xem chi tiết đơn hàng - ADMIN
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy chi tiết đơn hàng thành công
 */
router.get('/admin/:id', requireAdmin, getOrderDetailAdmin);

/**
 * @swagger
 * /orders/admin/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng - ADMIN
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               status: "processing"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái đơn hàng thành công
 */
router.put('/admin/:id/status', requireAdmin, updateOrderStatus);

/**
 * @swagger
 * /orders/admin/filter:
 *   post:
 *     summary: Lọc đơn hàng theo trạng thái - ADMIN
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               keyword: "Người"
 *               statuses: ["pending", "processing"]
 *               page: 1
 *               limit: 10
 *     responses:
 *       200:
 *         description: Lọc đơn hàng thành công
 */
router.post('/admin/filter', requireAdmin, filterOrdersAdmin);

module.exports = router;