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

/**
 * @swagger
 * /vouchers:
 *   get:
 *     summary: Lấy mã giảm giá khả dụng
 *     tags:
 *       - Vouchers
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getAvailableVouchers); 

/**
 * @swagger
 * /vouchers/apply:
 *   post:
 *     summary: Áp dụng voucher cho người dùng/giỏ hàng
 *     tags:
 *       - Vouchers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Applied
 */
router.post('/apply', requireAuth, applyVoucher); 

// --- ADMIN ROUTES ---
/**
 * @swagger
 * /vouchers/vouchers:
 *   get:
 *     summary: Lấy tất cả voucher (Admin)
 *     tags:
 *       - Vouchers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/vouchers', requireAdmin, getAllVouchersAdmin);

/**
 * @swagger
 * /vouchers/vouchers/{id}:
 *   get:
 *     summary: Lấy chi tiết voucher (Admin)
 *     tags:
 *       - Vouchers
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
router.get('/vouchers/:id', requireAdmin, getVoucherDetail);

/**
 * @swagger
 * /vouchers/vouchers:
 *   post:
 *     summary: Tạo voucher (Admin)
 *     tags:
 *       - Vouchers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/vouchers', requireAdmin, createVoucher);

/**
 * @swagger
 * /vouchers/vouchers/{id}:
 *   put:
 *     summary: Cập nhật voucher (Admin)
 *     tags:
 *       - Vouchers
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
router.put('/vouchers/:id', requireAdmin, updateVoucher);

/**
 * @swagger
 * /vouchers/vouchers/{id}:
 *   delete:
 *     summary: Xóa voucher (Admin)
 *     tags:
 *       - Vouchers
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
 *         description: Deleted
 */
router.delete('/vouchers/:id', requireAdmin, deleteVoucher);

/**
 * @swagger
 * /vouchers/vouchers/filter:
 *   post:
 *     summary: Lọc voucher (Admin)
 *     tags:
 *       - Vouchers
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
router.post('/vouchers/filter', requireAdmin, filterVouchersAdmin);

module.exports = router;