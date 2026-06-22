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
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm thành công
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /products/types:
 *   get:
 *     summary: Lấy danh sách loại sản phẩm
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lấy danh sách loại sản phẩm thành công
 */
router.get('/types', getAllProductTypes);

/**
 * @swagger
 * /products/{product_id}:
 *   get:
 *     summary: Chi tiết sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy chi tiết sản phẩm thành công
 */
router.get('/:product_id', getProductDetail);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Tạo sản phẩm mới kèm biến thể và ảnh - ADMIN
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               type_id: 1
 *               category_id: 2
 *               product_name: "Cuộn len Cotton Milk 50g"
 *               description: "Len sợi mềm mại, an toàn cho da em bé."
 *               product_status: "active"
 *               variants:
 *                 - sku: "LEN-CM-RED-50G"
 *                   price: 15000
 *                   color: "Đỏ"
 *                   size: "50g"
 *               images:
 *                 - image_url: "https://example.com/images/len-red.jpg"
 *               sort_order: 1
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 */
router.post('/', requireAdmin, createProduct);

/**
 * @swagger
 * /products/{product_id}:
 *   put:
 *     summary: Cập nhật sản phẩm và biến thể - ADMIN
 *     tags: [Products]
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
 *             example:
 *               type_id: 2
 *               category_id: 3
 *               product_name: "Cuộn len Cotton Milk 50g (Bản nâng cấp)"
 *               description: "Cập nhật mô tả mới"
 *               product_status: "active"
 *               variants:
 *                 - variant_id: 1
 *                   sku: "LEN-CM-RED-50G"
 *                   price: 16000
 *                   color: "Đỏ"
 *                   size: "50g"
 *               images: []
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 */
router.put('/:product_id', requireAdmin, updateProduct);

/**
 * @swagger
 * /products/{product_id}:
 *   delete:
 *     summary: Xóa sản phẩm - ADMIN
 *     tags: [Products]
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
 *         description: Xóa sản phẩm thành công
 */
router.delete('/:product_id', requireAdmin, deleteProduct);

/**
 * @swagger
 * /products/filter:
 *   post:
 *     summary: Lọc sản phẩm theo nhiều tiêu chí
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               keyword: "len cotton"
 *               category_ids: [1, 2]
 *               type_ids: [1]
 *               min_price: 10000
 *               max_price: 50000
 *               status: "active"
 *               page: 1
 *               limit: 10
 *     responses:
 *       200:
 *         description: Lọc sản phẩm thành công
 */
router.post('/filter', filterProducts);

module.exports = router;