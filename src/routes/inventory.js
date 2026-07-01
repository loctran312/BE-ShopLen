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
 *         description: Thành công
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
 *             example:
 *               - variant_id: 1
 *                 quantity_change: -5
 *                 transaction_type: "kiem_kho"
 *                 reference_code: "PXT-2026-06-03"
 *                 note: "Xuất hủy 5 cuộn do kho bị ngập ẩm mốc"
 *               - variant_id: 2
 *                 quantity_change: 100
 *                 transaction_type: "nhap_kho"
 *                 note: "Nhập Len Cotton Milk màu Xanh"
 *     responses:
 *       200:
 *         description: Điều chỉnh thành công
 */
router.post('/adjust', inventoryController.adjustInventory);

module.exports = router;