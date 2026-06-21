const express = require('express');

const { requireAuth, requireAdmin, requireShipper } = require('../middlewares/authMiddleware');
const { getShippers, createShipper, updateShipperStatus, updateProfile, getAvailableOrders } = require('../controllers/shipperController');

const router = express.Router();

// ADMIN ---
router.get('/admin/shippers', requireAuth, requireAdmin, getShippers);
router.post('/admin/shippers', requireAuth, requireAdmin, createShipper);
router.patch('/admin/shippers/:shipper_id/status', requireAuth, requireAdmin, updateShipperStatus);

// SHIPPER ---
router.put('/shipper/profile', requireAuth, requireShipper, updateProfile);
router.get('/shipper/available-orders', requireAuth, requireShipper, getAvailableOrders);

module.exports = router;