const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const {
	getAllProductTypes,
	getAllProducts,
	getProductDetail,
	createProduct,
	updateProduct,
	deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/types', getAllProductTypes);
router.get('/:product_id', getProductDetail);
router.post('/', requireAdmin, createProduct);
router.put('/:product_id', requireAdmin, updateProduct);
router.delete('/:product_id', requireAdmin, deleteProduct);

module.exports = router;