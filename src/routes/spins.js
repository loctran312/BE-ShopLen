const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { getSpinInfo, playSpin, getSpinHistory, getAdminConfigs, createAdminConfig, addTurnsToAllUsers, updateAdminConfig } = require('../controllers/spinController');

const router = express.Router();

// --- PUBLIC ROUTES (USER) ---

/**
 * @swagger
 * /spin/info:
 *   get:
 *     summary: Lấy thông tin vòng quay khởi tạo
 *     description: Trả về số lượt quay hiện tại của user và danh sách các ô phần thưởng (đã ẩn tỷ lệ thắng) để Frontend vẽ vòng quay.
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thành công
 */
router.get('/info', requireAuth, getSpinInfo);

/**
 * @swagger
 * /spin/play:
 *   post:
 *     summary: Thực hiện quay vòng quay may mắn
 *     description: Trừ 1 lượt quay của user, tính toán ngẫu nhiên dựa trên tỷ lệ và trả về phần thưởng trúng được.
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quay thành công (Trúng điểm, trúng voucher hoặc trượt)
 *       400:
 *         description: Đã hết lượt quay
 */
router.post('/play', requireAuth, playSpin);

/**
 * @swagger
 * /spin/history:
 *   get:
 *     summary: Lịch sử quay thưởng của cá nhân
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách lịch sử thành công
 */
router.get('/history', requireAuth, getSpinHistory);

// --- ADMIN ROUTES ---

/**
 * @swagger
 * /spin/admin/configs:
 *   get:
 *     summary: Xem toàn bộ cấu hình phần thưởng - ADMIN
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách cấu hình thành công
 */
router.get('/admin/configs', requireAuth, requireAdmin, getAdminConfigs);

/**
 * @swagger
 * /spin/admin/configs:
 *   post:
 *     summary: Thêm phần thưởng mới vào Vòng quay - ADMIN
 *     description: Tự động kiểm tra để đảm bảo tổng tỷ lệ thắng của toàn hệ thống không vượt quá 100%.
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     example:
 *       loai_qua: "voucher"
 *       gia_tri: 2  # ID của voucher trong bảng phieu_giam_gia, hoặc số điểm thưởng
 *       ty_le_thang: 15.5
 *       so_luong_con_lai: 100
 *       trang_thai: "active"
 *     responses:
 *       201:
 *         description: Thêm cấu hình thành công
 *       400:
 *         description: Tổng tỷ lệ thắng đã vượt mức 100%
 */
router.post('/admin/configs', requireAuth, requireAdmin, createAdminConfig);

/**
 * @swagger
 * /spin/admin/add-turns:
 *   post:
 *     summary: Bơm lượt quay cho toàn bộ hệ thống - ADMIN
 *     description: Nạp hoặc Reset lại toàn bộ tài khoản User đang active về mức tối đa 3 lượt quay.
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã bơm lượt thành công cho toàn hệ thống
 */
router.post('/admin/add-turns', requireAuth, requireAdmin, addTurnsToAllUsers);

/**
 * @swagger
 * /spin/admin/configs/{id}:
 *   put:
 *     summary: Cập nhật cấu hình phần thưởng - ADMIN
 *     description: Dùng để thay đổi tỷ lệ thắng, nạp thêm số lượng quà, hoặc bật/tắt (active/inactive) một ô quà.
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của cấu hình quà tặng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     example:
 *       ty_le_thang: 25.0
 *       so_luong_con_lai: 50
 *       trang_thai: "active"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Tổng tỷ lệ thắng đã vượt mức 100%
 */
router.put('/admin/configs/:id', requireAuth, requireAdmin, updateAdminConfig);

module.exports = router;