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
 *     summary: Lấy danh sách danh mục theo cây
 *     tags:
 *       - Categories
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
router.get('/', getAllCategories);

/**
 * @swagger
 * /categories/{category_id}:
 *   get:
 *     summary: Lấy chi tiết danh mục theo id (dạng cây con)
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:category_id', getCategoryDetail);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Tạo danh mục mới (Admin)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               category_name: "Yarn"
 *               description: "Main category"
 *               children: []
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', requireAdmin, createCategory);

/**
 * @swagger
 * /categories/{category_id}:
 *   put:
 *     summary: Cập nhật danh mục (Admin)
 *     tags:
 *       - Categories
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
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:category_id', requireAdmin, updateCategory);

/**
 * @swagger
 * /categories/{category_id}:
 *   delete:
 *     summary: Xóa danh mục (Admin)
 *     tags:
 *       - Categories
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
 *         description: Deleted
 */
router.delete('/:category_id', requireAdmin, deleteCategory);

/**
 * @swagger
 * /categories/filter:
 *   post:
 *     summary: Lọc danh mục (Admin)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/filter', requireAdmin, filterCategoriesAdmin);

module.exports = router;