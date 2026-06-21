const express = require('express');

const { requireAuth, requireAdmin, requireShipper } = require('../middlewares/authMiddleware');
const { getShippers, createShipper, updateShipperStatus, updateProfile, getAvailableOrders } = require('../controllers/shipperController');

const router = express.Router();

/**
 * @swagger
 * /admin/shippers:
 *   get:
 *     summary: Lấy danh sách Shipper có filter - ADMIN
 *     tags:
 *       - Delivery
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi trên 1 trang
 *       - in: query
 *         name: working_city_id
 *         schema:
 *           type: string
 *           example: HCM
 *         description: Mã tỉnh/thành phố hoạt động
 *     responses:
 *       200:
 *         description: Lấy danh sách shipper thành công
 *       401:
 *         description: Chưa đăng nhập hoặc sai token
 *       403:
 *         description: Không có quyền Admin
 */
router.get('/admin/shippers', requireAuth, requireAdmin, getShippers);

/**
 * @swagger
 * /admin/shippers:
 *   post:
 *     summary: Tạo Shipper mới - ADMIN
 *     tags:
 *       - Delivery
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               full_name: Nguyen Van A
 *               email: shipper@example.com
 *               phone_number: 0912345678
 *               working_city_id: HCM
 *     responses:
 *       201:
 *         description: Tạo Shipper thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc sai token
 *       403:
 *         description: Không có quyền Admin
 */
router.post('/admin/shippers', requireAuth, requireAdmin, createShipper);

/**
 * @swagger
 * /admin/shippers/{shipper_id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái Shipper - ADMIN
 *     tags:
 *       - Delivery
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipper_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của shipper
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               status: active
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái shipper thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc sai token
 *       403:
 *         description: Không có quyền Admin
 */
router.patch('/admin/shippers/:shipper_id/status', requireAuth, requireAdmin, updateShipperStatus);

/**
 * @swagger
 * /shipper/profile:
 *   put:
 *     summary: Cập nhật thông tin profile shipper
 *     tags:
 *       - Delivery
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               full_name: Nguyen Van A
 *               phone_number: 0912345678
 *               working_city_id: HCM
 *     responses:
 *       200:
 *         description: Cập nhật profile shipper thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc sai token
 *       403:
 *         description: Không đủ quyền
 */
router.put('/shipper/profile', requireAuth, requireShipper, updateProfile);

/**
 * @swagger
 * /shipper/available-orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng khả dụng cho shipper
 *     tags:
 *       - Delivery
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng khả dụng thành công
 *       401:
 *         description: Chưa đăng nhập hoặc sai token
 *       403:
 *         description: Không đủ quyền
 */
router.get('/shipper/available-orders', requireAuth, requireShipper, getAvailableOrders);

module.exports = router;

module.exports = router;