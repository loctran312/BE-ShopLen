const express = require("express");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  deleteVariant
} = require("../controllers/variantController");

const router = express.Router();

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