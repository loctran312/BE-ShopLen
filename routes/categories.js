const express = require('express');
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
router.post('/', createCategory);
router.put('/:category_id', updateCategory);
router.delete('/:category_id', deleteCategory);

module.exports = router;