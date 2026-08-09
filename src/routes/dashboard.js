const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { getDashboardInfo } = require('../controllers/dashboardController');

const router = express.Router();

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Xem chỉ số tổng quan hệ thống - ADMIN
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: velocity_limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng variant tối đa trả về trong product_velocity (sắp theo bán chạy nhất).
 *     responses:
 *       200:
 *         description: Lấy dữ liệu Dashboard thành công
 */
router.get('/', requireAuth, requireAdmin, getDashboardInfo);

module.exports = router;