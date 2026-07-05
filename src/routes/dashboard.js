const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { getDashboardInfo } = require('../controllers/dashboardController');

const router = express.Router();

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Xem chỉ số tổng quan hệ thống - ADMIN
 *     description: Trả về Doanh thu (hôm nay, tuần, tháng), tình trạng đơn hàng, thống kê user, cảnh báo kho và top 5 sản phẩm. Đã tối ưu múi giờ Việt Nam.
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dữ liệu Dashboard thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   revenue:
 *                     today: 1500000
 *                     this_week: 12500000
 *                     this_month: 45000000
 *                   orders_count:
 *                     pending: 15
 *                     processing: 5
 *                     shipping: 12
 *                     completed: 350
 *                     cancelled: 10
 *                   users:
 *                     active_customers: 1240
 *                     active_shippers: 18
 *                     new_this_month: 120
 *                   inventory_alerts:
 *                     out_of_stock: 5
 *                     low_stock: 12
 *                   top_selling_products:
 *                     - product_name: "Cuộn len Milk Cotton"
 *                       total_sold: 450
 *                     - product_name: "Combo kim móc"
 *                       total_sold: 210
 */
router.get('/', requireAuth, requireAdmin, getDashboardInfo);

module.exports = router;