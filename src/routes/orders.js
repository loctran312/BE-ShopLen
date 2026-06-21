const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { 
	createOrder, 
	getMyOrders, 
	getMyOrderDetail, 
	repurchaseOrder,
	getAllOrdersAdmin, 
	getOrderDetailAdmin, 
	updateOrderStatus,
	filterOrdersAdmin,
} = require('../controllers/orderController');

const router = express.Router();

// --- PUBLIC ROUTES (USER) ---
router.post('/', requireAuth, createOrder);
router.get('/my-orders', requireAuth, getMyOrders);
router.get('/my-orders/:id', requireAuth, getMyOrderDetail);
router.post('/repurchase/:id', requireAuth, repurchaseOrder);

// --- ADMIN ROUTES ---
router.get('/admin/all', requireAdmin, getAllOrdersAdmin);
router.get('/admin/:id', requireAdmin, getOrderDetailAdmin);
router.put('/admin/:id/status', requireAdmin, updateOrderStatus);
router.post('/admin/filter', requireAdmin, filterOrdersAdmin);

module.exports = router;