const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

router.use(requireAuth, requireAdmin);


/**
 * @swagger
 * /inventory/overview:
 *   post:
 *     summary: Lấy tổng quan tồn kho (Admin)
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/overview', inventoryController.getInventoryOverview);

/**
 * @swagger
 * /inventory/{variant_id}/history:
 *   get:
 *     summary: Lấy lịch sử tồn kho cho biến thể (Admin)
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
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:variant_id/history', inventoryController.getInventoryHistory);

/**
 * @swagger
 * /inventory/adjust:
 *   post:
 *     summary: Điều chỉnh tồn kho (Admin)
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Adjusted
 */
router.post('/adjust', inventoryController.adjustInventory);

module.exports = router;