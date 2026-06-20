const express = require("express");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  getAllVariantsStock,
  deleteVariant
} = require("../controllers/variantController");

const router = express.Router();

router.get("/stock", requireAdmin, getAllVariantsStock);
router.delete("/:variant_id", requireAdmin, deleteVariant);

module.exports = router;
