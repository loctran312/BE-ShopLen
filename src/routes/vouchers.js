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
router.get('/', getAvailableVouchers); 
router.post('/apply', requireAuth, applyVoucher); 

// --- ADMIN ROUTES ---
router.get('/vouchers', requireAdmin, getAllVouchersAdmin);
router.get('/vouchers/:id', requireAdmin, getVoucherDetail);
router.post('/vouchers', requireAdmin, createVoucher);
router.put('/vouchers/:id', requireAdmin, updateVoucher);
router.delete('/vouchers/:id', requireAdmin, deleteVoucher);
router.post('/vouchers/filter', requireAdmin, filterVouchersAdmin);

module.exports = router;