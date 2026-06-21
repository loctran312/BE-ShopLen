const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { toggleWishlist, getMyWishlist, triggerEmailNotifications } = require('../controllers/wishlistController');

const router = express.Router();

// User routes
/**
 * @swagger
 * /wishlist/toggle:
 *   post:
 *     summary: Thêm/bỏ sản phẩm vào wishlist cho người dùng hiện tại
 *     tags:
 *       - Wishlist
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
router.post('/toggle', requireAuth, toggleWishlist);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Lấy wishlist của người dùng hiện tại
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', requireAuth, getMyWishlist);

/**
 * @swagger
 * /wishlist/trigger-emails:
 *   post:
 *     summary: Gửi email thông báo cho người dùng wishlist (Admin)
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emails triggered
 */
router.post('/trigger-emails', requireAdmin, triggerEmailNotifications);

module.exports = router;