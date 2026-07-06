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
 *                     growth_vs_last_week: 15.5
 *                     revenue_chart:
 *                       - date: "2026-07-01"
 *                         value: 1200000
 *                       - date: "2026-07-02"
 *                         value: 0
 *                   top_orders_today:
 *                     - order_id: "DH-20260706-0001"
 *                       customer_name: "Trần Hữu Lộc"
 *                       total_amount: 850000
 *                   orders_count:
 *                     pending: 15
 *                     processing: 5
 *                     shipping: 12
 *                     completed: 350
 *                     growth_vs_last_week: -5.2
 *                   workshop_stats:
 *                     bookings_today: 12
 *                     upcoming_count: 5
 *                     growth_vs_last_week: 25.0
 *                     top_workshops:
 *                       - title: "Workshop Đan Khăn"
 *                         total_bookings: 45
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
 */
router.get('/', requireAuth, requireAdmin, getDashboardInfo);

module.exports = router;