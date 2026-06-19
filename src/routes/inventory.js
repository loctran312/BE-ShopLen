const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

// Tất cả API kho đều yêu cầu Admin
router.use(requireAuth, requireAdmin);

router.post('/overview', inventoryController.getInventoryOverview);
router.get('/:variant_id/history', inventoryController.getInventoryHistory);
router.post('/adjust', inventoryController.adjustInventory);

module.exports = router;