const express = require('express');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');
const { toggleWishlist, getMyWishlist, triggerEmailNotifications } = require('../controllers/wishlistController');

const router = express.Router();

// User routes
router.post('/toggle', requireAuth, toggleWishlist);
router.get('/', requireAuth, getMyWishlist);

// Admin route
router.post('/trigger-emails', requireAdmin, triggerEmailNotifications);

module.exports = router;