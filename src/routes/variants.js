const express = require("express");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  getAllVariantsStock,
  deleteVariant
} = require("../controllers/variantController");

const router = express.Router();

/**
 * @swagger
 * /variants/stock:
 *   get:
 *     summary: Lấy danh sách tồn kho của tất cả biến thể - ADMIN
 *     tags:
 *       - Inventory
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
 *         description: Lấy tồn kho biến thể thành công
 */
router.get("/stock", requireAdmin, getAllVariantsStock);

/**
 * @swagger
 * /variants/{variant_id}:
 *   delete:
 *     summary: Xóa một biến thể (Variant) - ADMIN
 *     tags:
 *       - Products
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
 *         description: Xóa biến thể thành công
 */
router.delete("/:variant_id", requireAdmin, deleteVariant);

module.exports = router;