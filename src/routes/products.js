const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const {
	getAllProductTypes,
	getAllProducts,
	getProductDetail,
	createProduct,
	updateProduct,
	deleteProduct,
	filterProducts,
} = require('../controllers/productController');

const router = express.Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lấy danh sách sản phẩm kèm biến thể và ảnh
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /products/types:
 *   get:
 *     summary: Lấy danh sách loại sản phẩm
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/types', getAllProductTypes);

/**
 * @swagger
 * /products/{product_id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:product_id', getProductDetail);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Tạo sản phẩm mới kèm biến thể và ảnh (Admin)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', requireAdmin, createProduct);

/**
 * @swagger
 * /products/{product_id}:
 *   put:
 *     summary: Cập nhật sản phẩm và biến thể (Admin)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:product_id', requireAdmin, updateProduct);

/**
 * @swagger
 * /products/{product_id}:
 *   delete:
 *     summary: Xóa sản phẩm (Admin)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:product_id', requireAdmin, deleteProduct);

/**
 * @swagger
 * /products/filter:
 *   post:
 *     summary: Lọc sản phẩm theo nhiều tiêu chí
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/filter', filterProducts);

module.exports = router;