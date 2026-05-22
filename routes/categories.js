const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const {
  getAllCategories,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:category_id', getCategoryDetail);
router.post('/', requireAdmin, createCategory);
router.put('/:category_id', requireAdmin, updateCategory);
router.delete('/:category_id', requireAdmin, deleteCategory);

module.exports = router;