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
router.get('/', getActivePromotions); 
router.get('/:id', getPromotionDetail); 

// --- ADMIN ROUTES ---
router.get('/promotions/all', requireAdmin, getAllPromotionsAdmin);
router.post('/promotions', requireAdmin, createPromotion);
router.put('/promotions/:id', requireAdmin, updatePromotion);
router.delete('/promotions/:id', requireAdmin, deletePromotion);
router.post('/promotions/filter', requireAdmin, filterPromotionsAdmin);

module.exports = router;