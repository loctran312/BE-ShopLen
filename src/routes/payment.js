const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const { momoIpn, processRefund, momoReturn } = require('../controllers/paymentController');

const router = express.Router();

// Route IPN ngầm của MoMo (cứ để đó)
router.post('/momo/ipn', momoIpn);

// Route xử lý Redirect khi khách hàng thanh toán xong
router.get('/momo/return', momoReturn);

// Route Hoàn tiền
router.post('/refund/:orderId', requireAdmin, processRefund);

module.exports = router;