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
 *     summary: Lấy tổng quan tồn kho biến thể (Admin)
 *     tags:
 *       - Variants
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/stock", requireAdmin, getAllVariantsStock);

/**
 * @swagger
 * /variants/{variant_id}:
 *   delete:
 *     summary: Xóa biến thể (Admin)
 *     tags:
 *       - Variants
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
 *         description: Deleted
 */
router.delete("/:variant_id", requireAdmin, deleteVariant);

module.exports = router;
