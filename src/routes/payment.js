const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const { momoIpn, processRefund, momoReturn } = require('../controllers/paymentController');

const router = express.Router();

// Route IPN ngầm của MoMo (cứ để đó)
// Route IPN (MoMo)
/**
 * @swagger
 * /payment/momo/ipn:
 *   post:
 *     summary: Endpoint IPN của MoMo (nội bộ)
 *     tags:
 *       - Payment
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/momo/ipn', momoIpn);

// MoMo return (redirect)
/**
 * @swagger
 * /payment/momo/return:
 *   get:
 *     summary: URL trả về sau khi thanh toán MoMo
 *     tags:
 *       - Payment
 *     responses:
 *       302:
 *         description: Redirect
 */
router.get('/momo/return', momoReturn);

// Refund
/**
 * @swagger
 * /payment/refund/{orderId}:
 *   post:
 *     summary: Xử lý hoàn tiền cho đơn hàng (Admin)
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Refund processed
 */
router.post('/refund/:orderId', requireAdmin, processRefund);

module.exports = router;