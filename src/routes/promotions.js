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
 *     summary: Lấy danh sách khuyến mãi đang hoạt động
 *     tags:
 *       - Promotions
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getActivePromotions); 

/**
 * @swagger
 * /promotions/{id}:
 *   get:
 *     summary: Lấy chi tiết khuyến mãi
 *     tags:
 *       - Promotions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', getPromotionDetail); 

// --- ADMIN ROUTES ---
/**
 * @swagger
 * /promotions/promotions/all:
 *   get:
 *     summary: Lấy tất cả khuyến mãi (Admin)
 *     tags:
 *       - Promotions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/promotions/all', requireAdmin, getAllPromotionsAdmin);

/**
 * @swagger
 * /promotions/promotions:
 *   post:
 *     summary: Tạo khuyến mãi (Admin)
 *     tags:
 *       - Promotions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/promotions', requireAdmin, createPromotion);

/**
 * @swagger
 * /promotions/promotions/{id}:
 *   put:
 *     summary: Cập nhật khuyến mãi (Admin)
 *     tags:
 *       - Promotions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/promotions/:id', requireAdmin, updatePromotion);

/**
 * @swagger
 * /promotions/promotions/{id}:
 *   delete:
 *     summary: Xóa khuyến mãi (Admin)
 *     tags:
 *       - Promotions
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
 *         description: Deleted
 */
router.delete('/promotions/:id', requireAdmin, deletePromotion);

/**
 * @swagger
 * /promotions/promotions/filter:
 *   post:
 *     summary: Lọc khuyến mãi (Admin)
 *     tags:
 *       - Promotions
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
router.post('/promotions/filter', requireAdmin, filterPromotionsAdmin);

module.exports = router;