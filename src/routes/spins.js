const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { getSpinInfo, playSpin, getSpinHistory, getAdminConfigs, createAdminConfig, addTurnsToAllUsers, updateAdminConfig, deleteAdminConfig } = require('../controllers/spinController');

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
 *     summary: Xem lịch sử quay thưởng cá nhân
 *     tags: [Spins]
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
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
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
 *         description: Lấy danh sách thành công
 */
router.get('/admin/configs', requireAuth, requireAdmin, getAdminConfigs);

/**
 * @swagger
 * /spin/admin/configs:
 *   post:
 *     summary: Tạo cấu hình phần thưởng mới - ADMIN
 *     description: Tổng tỷ lệ thắng của các ô active không được vượt quá 100%.
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               loai_qua: "voucher"
 *               gia_tri: "50000"
 *               ty_le_thang: 5.5
 *               so_luong_con_lai: 50
 *               trang_thai: "active"
 *     responses:
 *       201:
 *         description: Tạo cấu hình thành công
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
 *         description: ID của cấu hình quà tặng
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
 *               ty_le_thang: 25.0
 *               so_luong_con_lai: 200
 *               trang_thai: "active"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Tổng tỷ lệ thắng đã vượt mức 100%
 */
router.put('/admin/configs/:id', requireAuth, requireAdmin, updateAdminConfig);

/**
 * @swagger
 * /spin/admin/configs/{id}:
 *   delete:
 *     summary: Xóa cấu hình phần thưởng - ADMIN
 *     description: Hệ thống sẽ chặn lệnh xóa nếu phần thưởng này đã có người quay trúng để bảo vệ lịch sử. Lúc đó chỉ có thể dùng lệnh Cập nhật để đưa về inactive.
 *     tags: [Spins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID của cấu hình quà tặng
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Báo lỗi dính dữ liệu lịch sử
 *       404:
 *         description: Không tìm thấy phần thưởng
 */
router.delete('/admin/configs/:id', requireAuth, requireAdmin, deleteAdminConfig);

module.exports = router;