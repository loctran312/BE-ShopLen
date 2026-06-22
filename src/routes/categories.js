const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const {
    getAllCategories,
    getCategoryDetail,
    createCategory,
    updateCategory,
    deleteCategory,
    filterCategoriesAdmin,
} = require('../controllers/categoryController');

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lấy danh sách danh mục (cây phân cấp)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Lấy thành công
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /categories/{category_id}:
 *   get:
 *     summary: Xem chi tiết danh mục theo ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:category_id', getCategoryDetail);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Tạo danh mục - ADMIN
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               category_name: "Sợi Len"
 *               description: "Danh mục chính cho sợi len"
 *               image_url: "https://i.ibb.co/example.jpg"
 *               parent_category_id: null
 *               children:
 *                 - category_name: "Sợi len bông"
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', requireAdmin, createCategory);

/**
 * @swagger
 * /categories/{category_id}:
 *   put:
 *     summary: Cập nhật danh mục - ADMIN
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category_id
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
 *               category_name: "Danh mục cha (Cập nhật)"
 *               description: "Mô tả đã cập nhật"
 *               image_url: "https://i.ibb.co/example-updated.jpg"
 *               children: []
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:category_id', requireAdmin, updateCategory);

/**
 * @swagger
 * /categories/{category_id}:
 *   delete:
 *     summary: Xóa danh mục - ADMIN
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:category_id', requireAdmin, deleteCategory);

/**
 * @swagger
 * /categories/filter:
 *   post:
 *     summary: Lọc danh mục theo từ khóa - ADMIN
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               keyword: "len cotton"
 *               parent_category_id: 3
 *               page: 1
 *               limit: 10
 *     responses:
 *       200:
 *         description: Lọc thành công
 */
router.post('/filter', requireAdmin, filterCategoriesAdmin);

module.exports = router;