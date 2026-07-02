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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   rewards:
 *                     - reward_id: 1
 *                       required_points: 200
 *                       status: active
 *                       created_at: "2026-07-02T07:10:00Z"
 *                       voucher_id: 5
 *                       voucher_code: "LOYALTY200"
 *                       voucher_name: "Giảm 20K"
 *                       discount_type: "fixed"
 *                       discount_value: "20000.00"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rewards:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reward_id:
 *                             type: integer
 *                           required_points:
 *                             type: integer
 *                           voucher_code:
 *                             type: string
 *                           voucher_name:
 *                             type: string
 *                           discount_type:
 *                             type: string
 *                           discount_value:
 *                             type: string
 *               example:
 *                 success: true
 *                 data:
 *                   rewards:
 *                     - reward_id: 1
 *                       required_points: 200
 *                       voucher_code: "LOYALTY200"
 *                       voucher_name: "Giảm 20K cho KH thân thiết"
 *                       discount_type: "fixed"
 *                       discount_value: "20000.00"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           history_id:
 *                             type: integer
 *                           points_changed:
 *                             type: integer
 *                           transaction_type:
 *                             type: string
 *                           reference_code:
 *                             type: string
 *                           description:
 *                             type: string
 *               example:
 *                 success: true
 *                 data:
 *                   history:
 *                     - history_id: 5
 *                       points_changed: 150
 *                       transaction_type: "earn"
 *                       reference_code: "DH-20260620-0001"
 *                       description: "Tích điểm từ đơn hàng"
 *                       created_at: "2026-06-20T15:30:00Z"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     voucher_code:
 *                       type: string
 *                     points_deducted:
 *                       type: integer
 *                     remaining_points:
 *                       type: integer
 *               example:
 *                 success: true
 *                 message: "Đổi điểm lấy Voucher thành công"
 *                 data:
 *                   voucher_code: "LOYALTY200"
 *                   points_deducted: 200
 *                   remaining_points: 300
 *       400:
 *         description: Không đủ điểm hoặc đã sở hữu voucher này
 */
router.post('/redeem', requireAuth, loyaltyController.redeemReward);

module.exports = router;