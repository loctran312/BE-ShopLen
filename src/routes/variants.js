const express = require("express");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  getAllVariantsStock,
  deleteVariant,
  updateVariantStock,
  updateVariantStockChanges
} = require("../controllers/variantController");

const router = express.Router();

router.get("/stock", requireAdmin, getAllVariantsStock);
router.patch("/:variant_id/stock", requireAdmin, updateVariantStock);
router.patch("/:variant_id/stock-change", requireAdmin, updateVariantStockChanges);
router.delete("/:variant_id", requireAdmin, deleteVariant);

module.exports = router;
