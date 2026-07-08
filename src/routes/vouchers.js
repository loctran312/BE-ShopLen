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
  saveVoucher,
  getMySavedVouchers,
  filterVouchersAdmin
} = require('../controllers/voucherController');

const router = express.Router();

/**
 * @swagger
 * /vouchers:
 *   get:
 *     summary: Lấy danh sách voucher đang hoạt động
 *     tags:
 *       - Vouchers
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
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', getAvailableVouchers);

/**
 * @swagger
 * /vouchers/apply:
 *   post:
 *     summary: Kiểm tra và áp dụng thử Voucher
 *     tags:
 *       - Vouchers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               code: "WELCOME10"
 *               order_value: 250000
 *               shipping_method_id: "GH_NHANH"
 *     responses:
 *       200:
 *         description: Trả về số tiền được giảm
 */
router.post('/apply', requireAuth, applyVoucher); 

/**
 * @swagger
 * /vouchers/vouchers:
 *   get:
 *     summary: Quản lý danh sách voucher - ADMIN
 *     tags:
 *       - Vouchers
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
 *         description: Thành công
 */
router.get('/vouchers', requireAdmin, getAllVouchersAdmin);

/**
 * @swagger
 * /vouchers/vouchers/{id}:
 *   get:
 *     summary: Lấy chi tiết voucher - ADMIN
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
 *         description: Thành công
 */
router.get('/vouchers/:id', requireAdmin, getVoucherDetail);

/**
 * @swagger
 * /vouchers/vouchers:
 *   post:
 *     summary: Tạo voucher mới - ADMIN
 *     tags:
 *       - Vouchers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               code: "WINTER2026"
 *               voucher_name: "Sale Chào Đông 2026"
 *               discount_type: "fixed"
 *               value: 50000
 *               minimum_value: 300000
 *               max_discount: null
 *               quantity: 100
 *               start_date: "2026-06-01T00:00:00Z"
 *               end_date: "2026-06-30T23:59:59Z"
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/vouchers', requireAdmin, createVoucher);

/**
 * @swagger
 * /vouchers/vouchers/{id}:
 *   put:
 *     summary: Cập nhật voucher - ADMIN
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               code: "SUMMER2026"
 *               voucher_name: "Sale Chào Hè"
 *               discount_type: "fixed"
 *               value: 50000
 *               quantity: 200
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/vouchers/:id', requireAdmin, updateVoucher);

/**
 * @swagger
 * /vouchers/vouchers/{id}:
 *   delete:
 *     summary: Xóa voucher - ADMIN
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
 *         description: Xóa thành công
 */
router.delete('/vouchers/:id', requireAdmin, deleteVoucher);

/**
 * @swagger
 * /vouchers/save:
 *   post:
 *     summary: Khách hàng - Lưu voucher vào ví cá nhân
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               voucher_id: 1
 *     responses:
 *       200:
 *         description: Lưu voucher thành công
 */
router.post('/save', requireAuth, saveVoucher);

/**
 * @swagger
 * /vouchers/my-vouchers:
 *   get:
 *     summary: Khách hàng - Lấy danh sách voucher đã lưu
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/my-vouchers', requireAuth, getMySavedVouchers);

/**
 * @swagger
 * /vouchers/vouchers/filter:
 *   post:
 *     summary: Lọc voucher theo nhiều tiêu chí - ADMIN
 *     tags:
 *       - Vouchers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               keyword: "WELCOME"
 *               discount_types: ["percent", "fixed"]
 *               page: 1
 *               limit: 10
 *     responses:
 *       200:
 *         description: Lọc thành công
 */
router.post('/vouchers/filter', requireAdmin, filterVouchersAdmin);

module.exports = router;