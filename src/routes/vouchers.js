const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { 
	getAvailableVouchers, 
	applyVoucher, 
	getAllVouchersAdmin, 
	getVoucherDetail, 
	createVoucher, 
	updateVoucher, 
	deleteVoucher,
	filterVouchersAdmin
} = require('../controllers/voucherController');

const router = express.Router();

// --- PUBLIC ROUTES ---
// Khách vãng lai cũng có thể xem danh sách voucher khả dụng
router.get('/', getAvailableVouchers); 
// Áp dụng voucher phải đăng nhập (để check lịch sử sử dụng)
router.post('/apply', requireAuth, applyVoucher); 

// --- ADMIN ROUTES ---
// Quản lý CRUD dành cho Admin
router.get('/vouchers', requireAdmin, getAllVouchersAdmin);
router.get('/vouchers/:id', requireAdmin, getVoucherDetail);
router.post('/vouchers', requireAdmin, createVoucher);
router.put('/vouchers/:id', requireAdmin, updateVoucher);
router.delete('/vouchers/:id', requireAdmin, deleteVoucher);
router.post('/vouchers/filter', requireAdmin, filterVouchersAdmin);

module.exports = router;