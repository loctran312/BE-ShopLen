const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { toggleWishlist, getMyWishlist, triggerEmailNotifications } = require('../controllers/wishlistController');

const router = express.Router();

/**
 * @swagger
 * /wishlist/toggle:
 *   post:
 *     summary: Thêm hoặc xóa sản phẩm khỏi danh sách yêu thích
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               product_id: 2
 *     responses:
 *       200:
 *         description: Trả về action là 'added' hoặc 'removed'
 */
router.post('/toggle', requireAuth, toggleWishlist);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích của người dùng
 *     tags:
 *       - Wishlist
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
 *         description: Thành công
 */
router.get('/', requireAuth, getMyWishlist);

/**
 * @swagger
 * /wishlist/trigger-emails:
 *   post:
 *     summary: Gửi email nhắc nhở Giảm giá / Hàng về - ADMIN
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/trigger-emails', requireAdmin, triggerEmailNotifications);

module.exports = router;