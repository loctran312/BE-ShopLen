const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const loyaltyController = require('../controllers/loyaltyController');

const router = express.Router();

// ==========================================
// ADMIN
// ==========================================

/**
 * @swagger
 * /loyalty/admin/rewards:
 *   post:
 *     summary: Tạo cấu hình gói đổi điểm mới - ADMIN
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucher_id
 *               - required_points
 *             properties:
 *               voucher_id:
 *                 type: integer
 *                 description: ID của voucher
 *                 example: 5
 *               required_points:
 *                 type: integer
 *                 description: Số điểm cần để đổi voucher
 *                 example: 200
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/admin/rewards', requireAuth, requireAdmin, loyaltyController.createReward);

/**
 * @swagger
 * /loyalty/admin/rewards:
 *   get:
 *     summary: Xem toàn bộ danh sách gói đổi điểm - ADMIN
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/admin/rewards', requireAuth, requireAdmin, loyaltyController.getAdminRewardsList);

/**
 * @swagger
 * /loyalty/admin/rewards/{id}/status:
 *   put:
 *     summary: Bật/Tắt gói đổi điểm - ADMIN
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của gói đổi điểm
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 description: Trạng thái của gói đổi điểm
 *             example:
 *               status: inactive
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/admin/rewards/:id/status', requireAuth, requireAdmin, loyaltyController.toggleRewardStatus);

/**
 * @swagger
 * /loyalty/admin/rewards/{id}:
 *   delete:
 *     summary: Xóa gói đổi điểm - ADMIN
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của gói đổi điểm
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy gói đổi điểm
 */
router.delete('/admin/rewards/:id', requireAuth, requireAdmin, loyaltyController.deleteReward);


// ==========================================
// USER
// ==========================================

/**
 * @swagger
 * /loyalty/rewards:
 *   get:
 *     summary: Xem các gói Voucher có thể đổi - USER
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/rewards', requireAuth, loyaltyController.getUserRewardsList);

/**
 * @swagger
 * /loyalty/history:
 *   get:
 *     summary: Xem lịch sử biến động điểm tích lũy - USER
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 */
router.get('/history', requireAuth, loyaltyController.getPointHistory);

/**
 * @swagger
 * /loyalty/redeem:
 *   post:
 *     summary: Thực hiện đổi điểm lấy Voucher - USER
 *     tags:
 *       - Loyalty
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reward_id
 *             properties:
 *               reward_id:
 *                 type: integer
 *                 description: ID của gói đổi điểm
 *             example:
 *               reward_id: 1
 *     responses:
 *       200:
 *         description: Đổi điểm thành công
 *       400:
 *         description: Không đủ điểm hoặc đã sở hữu voucher này
 */
router.post('/redeem', requireAuth, loyaltyController.redeemReward);

module.exports = router;