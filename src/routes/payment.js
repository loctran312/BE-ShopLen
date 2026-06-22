const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const { momoIpn, processRefund, momoReturn } = require('../controllers/paymentController');

const router = express.Router();

/**
 * @swagger
 * /payment/momo/ipn:
 *   post:
 *     summary: Webhook nhận thông báo từ MoMo (Hệ thống dùng)
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Nhận Webhook thành công
 */
router.post('/momo/ipn', momoIpn);

/**
 * @swagger
 * /payment/momo/return:
 *   get:
 *     summary: Redirect sau khi thanh toán MoMo xong
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/momo/return', momoReturn);

/**
 * @swagger
 * /payment/refund/{orderId}:
 *   post:
 *     summary: Xử lý hoàn tiền cho khách hàng - ADMIN
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hoàn tiền thành công
 */
router.post('/refund/:orderId', requireAdmin, processRefund);

module.exports = router;