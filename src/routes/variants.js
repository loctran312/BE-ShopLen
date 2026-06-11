const express = require("express");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  deleteVariant,
  updateVariantStock,
  updateVariantStockChanges
} = require("../controllers/variantController");

const router = express.Router();

router.patch("/:variant_id/stock", requireAdmin, updateVariantStock);
router.patch("/:variant_id/stock-change", requireAdmin, updateVariantStockChanges);
router.delete("/:variant_id", requireAdmin, deleteVariant);

module.exports = router;
