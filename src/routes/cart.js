const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const {
	getCart,
	addToCart,
	updateCartItem,
	deleteCartItem,
	syncCart
} = require('../controllers/cartController');

const router = express.Router();

router.use(requireAuth);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/sync', syncCart);
router.put('/:variant_id', updateCartItem);
router.delete('/:variant_id', deleteCartItem);

module.exports = router;