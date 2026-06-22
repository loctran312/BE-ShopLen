const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const { 
    getActivePromotions, 
    getPromotionDetail, 
    getAllPromotionsAdmin, 
    createPromotion, 
    updatePromotion, 
    deletePromotion,
    filterPromotionsAdmin
} = require('../controllers/promotionController');

const router = express.Router();

// --- PUBLIC ROUTES ---

/**
 * @swagger
 * /promotions:
 *   get:
 *     summary: Lấy khuyến mãi đang hoạt động (Public)
 *     tags: [Promotions]
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
 *         description: Lấy danh sách khuyến mãi khả dụng thành công
 */
router.get('/', getActivePromotions); 

/**
 * @swagger
 * /promotions/{id}:
 *   get:
 *     summary: Lấy chi tiết một khuyến mãi (Public)
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:id', getPromotionDetail); 

// --- ADMIN ROUTES ---

/**
 * @swagger
 * /promotions/promotions/all:
 *   get:
 *     summary: Lấy tất cả khuyến mãi - ADMIN
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
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
 *         description: Lấy tất cả khuyến mãi thành công
 */
router.get('/promotions/all', requireAdmin, getAllPromotionsAdmin);

/**
 * @swagger
 * /promotions/promotions:
 *   post:
 *     summary: Tạo mới khuyến mãi - ADMIN
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: "Flash Sale Len Đan Mùa Đông"
 *               discount_type: "percent"
 *               value: 20
 *               min_order_value: 0
 *               start_date: "2026-11-01T00:00:00Z"
 *               end_date: "2026-11-30T23:59:59Z"
 *               status: "active"
 *               applicable_products: [{ "product_id": 1 }, { "product_id": 2 }]
 *     responses:
 *       201:
 *         description: Tạo khuyến mãi thành công
 */
router.post('/promotions', requireAdmin, createPromotion);

/**
 * @swagger
 * /promotions/promotions/{id}:
 *   put:
 *     summary: Cập nhật khuyến mãi - ADMIN
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               title: "Flash Sale Len Đan Mùa Đông (Gia hạn)"
 *               discount_type: "percent"
 *               value: 25
 *               min_order_value: 0
 *               start_date: "2026-11-01T00:00:00Z"
 *               end_date: "2026-12-15T23:59:59Z"
 *               status: "active"
 *               applicable_products: [{ "product_id": 1 }, { "product_id": 3 }]
 *     responses:
 *       200:
 *         description: Cập nhật khuyến mãi thành công
 */
router.put('/promotions/:id', requireAdmin, updatePromotion);

/**
 * @swagger
 * /promotions/promotions/{id}:
 *   delete:
 *     summary: Xóa khuyến mãi - ADMIN
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa khuyến mãi thành công
 */
router.delete('/promotions/:id', requireAdmin, deletePromotion);

/**
 * @swagger
 * /promotions/promotions/filter:
 *   post:
 *     summary: Lọc khuyến mãi theo nhiều tiêu chí - ADMIN
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               keyword: "Sale"
 *               discount_types: ["fixed"]
 *               statuses: ["active"]
 *               page: 1
 *               limit: 10
 *     responses:
 *       200:
 *         description: Lọc khuyến mãi thành công
 */
router.post('/promotions/filter', requireAdmin, filterPromotionsAdmin);

module.exports = router;