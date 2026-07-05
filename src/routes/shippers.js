const express = require('express');
const { requireAuth, requireAdmin, requireShipper } = require('../middlewares/authMiddleware');
const { getShippers, createShipper, updateShipperStatus, updateShipperLocation, 
        getProfile, updateProfile, getAvailableOrders, acceptOrder, updateDeliveryStatus, getMyDeliveries, getDeliveryDetail } = require('../controllers/shipperController');

const router = express.Router();

/**
 * @swagger
 * /admin/shippers:
 *   get:
 *     summary: Lấy danh sách Shipper có filter - ADMIN
 *     tags:
 *       - Shippers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *       - in: query
 *         name: working_city_id
 *         schema:
 *           type: string
 *         example: HCM
 *     responses:
 *       200:
 *         description: Lấy danh sách shipper thành công
 */
router.get('/admin/shippers', requireAuth, requireAdmin, getShippers);

/**
 * @swagger
 * /admin/shippers:
 *   post:
 *     summary: Tạo Shipper mới - ADMIN
 *     tags:
 *       - Shippers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               full_name: "Lê Phân Phối"
 *               phone: "0999888777"
 *               email: "lephanphoi@gmail.com"
 *               working_city_id: "DN"
 *     responses:
 *       201:
 *         description: Tạo tài khoản shipper thành công
 */
router.post('/admin/shippers', requireAuth, requireAdmin, createShipper);

/**
 * @swagger
 * /admin/shippers/{shipper_id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hoạt động của Shipper - ADMIN
 *     tags:
 *       - Shippers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipper_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "SHP013"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               status: "INACTIVE"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái tài khoản thành công
 */
router.patch('/admin/shippers/:shipper_id/status', requireAuth, requireAdmin, updateShipperStatus);

/**
 * @swagger
 * /admin/shippers/{shipper_id}/location:
 *   put:
 *     summary: Điều chuyển khu vực hoạt động của Shipper - ADMIN
 *     tags:
 *       - Shippers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipper_id
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
 *               working_city_id: "DN"
 *     responses:
 *       200:
 *         description: Điều chuyển thành công
 *       404:
 *         description: Không tìm thấy Shipper
 */
router.put('/admin/shippers/:shipper_id/location', requireAuth, requireAdmin, updateShipperLocation);

/**
 * @swagger
 * /shipper/profile:
 *   get:
 *     summary: Xem thông tin hồ sơ cá nhân - SHIPPER
 *     tags:
 *       - Shippers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin cá nhân thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   profile:
 *                     user_id: 13
 *                     first_name: "Nguyễn Văn Giao"
 *                     last_name: "Nhanh"
 *                     shipper_code: "SHP013"
 *                     personal_address: "888 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM"
 *                     working_city_id: "HCM"
 */
router.get('/shipper/profile', requireAuth, requireShipper, getProfile);

/**
 * @swagger
 * /shipper/profile:
 *   put:
 *     summary: Cập nhật thông tin cá nhân - SHIPPER
 *     tags:
 *       - Shippers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               full_name: "Nguyễn Văn Giao Nhanh"
 *               phone: "0988888881"
 *               personal_address: "888 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin cá nhân thành công
 */
router.put('/shipper/profile', requireAuth, requireShipper, updateProfile);

/**
 * @swagger
 * /shipper/available-orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng đang chờ giao - SHIPPER
 *     tags:
 *       - Shippers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng phù hợp thành công
 */
router.get('/shipper/available-orders', requireAuth, requireShipper, getAvailableOrders);

/**
 * @swagger
 * /shipper/orders/{order_id}/accept:
 *   put:
 *     summary: Nhận giao một đơn hàng - SHIPPER
 *     tags: [Shippers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Nhận đơn hàng thành công
 *       400:
 *         description: Đơn hàng đã bị người khác nhận
 */
router.put('/shipper/orders/:order_id/accept', requireAuth, requireShipper, acceptOrder);

/**
 * @swagger
 * /shipper/orders/{order_id}/delivery-status:
 *   put:
 *     summary: Xác nhận kết quả giao hàng - SHIPPER
 *     tags: [Shippers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example:
 *             status: "success"
 *             proof_image: "https://link-anh-chup-goi-hang.com"
 *             failed_reason: ""
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/shipper/orders/:order_id/delivery-status', requireAuth, requireShipper, updateDeliveryStatus);

/**
 * @swagger
 * /shipper/my-deliveries:
 *   get:
 *     summary: Lấy danh sách các đơn hàng đã nhận/lịch sử giao - SHIPPER
 *     tags: [Shippers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Trạng thái giao hàng (accepted, delivered, failed). Bỏ trống để lấy tất cả.
 *         example: "accepted"
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/shipper/my-deliveries', requireAuth, requireShipper, getMyDeliveries);

/**
 * @swagger
 * /shipper/orders/{order_id}:
 *   get:
 *     summary: Xem chi tiết một đơn hàng được phân công - SHIPPER
 *     tags: [Shippers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy chi tiết đơn giao thành công
 */
router.get('/shipper/orders/:order_id', requireAuth, requireShipper, getDeliveryDetail);

module.exports = router;