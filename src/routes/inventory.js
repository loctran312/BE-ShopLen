const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

router.use(requireAuth, requireAdmin);

/**
 * @swagger
 * /inventory/overview:
 *   post:
 *     summary: Tổng quan tồn kho với nhiều tiêu chí lọc - ADMIN
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               page: 1
 *               limit: 10
 *               keyword: "Cotton"
 *               stock_status: "in_stock"
 *     responses:
 *       200:
 *         description: >
 *           Lấy dữ liệu thành công. Mỗi phần tử trong data.inventory có dạng:
 *           { variant_id, product_id, product_name, sku, color, size, available_stock,
 *             reserved_stock, physical_stock, selling_price, effective_price,
 *             average_cost, latest_unit_cost, expected_profit, expected_margin, is_loss }
 */
router.post('/overview', inventoryController.getInventoryOverview);

/**
 * @swagger
 * /inventory/{variant_id}/history:
 *   get:
 *     summary: Lịch sử tồn kho của một biến thể - ADMIN
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variant_id
 *         required: true
 *         schema:
 *           type: integer
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
router.get('/:variant_id/history', inventoryController.getInventoryHistory);

/**
 * @swagger
 * /inventory/adjust:
 *   post:
 *     summary: Điều chỉnh tồn kho với nhiều biến thể - ADMIN
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *           example:
 *             - variant_id: 1
 *               quantity_change: 5
 *               unit_cost: 120000
 *               transaction_type: "nhap_kho"
 *               reference_code: "PXT-2026-06-03"
 *               note: "Nhập hàng đợt 1 tháng 6"
 *             - variant_id: 2
 *               physical_quantity: 100
 *               transaction_type: "kiem_kho"
 *               note: "Kiểm kho định kỳ"
 *     responses:
 *       200:
 *         description: >
 *           Điều chỉnh thành công. Với 'nhap_kho', mỗi phần tử trả kèm:
 *           unit_cost, total_cost, average_cost, latest_unit_cost, và loss_warning (nếu đang bán lỗ)
 *           gồm { effective_price, average_cost, profit, message }.
 *       400:
 *         description: >
 *           Dữ liệu không hợp lệ - ví dụ quantity_change <= 0, unit_cost thiếu/<=0 khi nhap_kho,
 *           hoặc cố nhập kho cho biến thể thuộc loại Workshop.
 */
router.post('/adjust', inventoryController.adjustInventory);

module.exports = router;