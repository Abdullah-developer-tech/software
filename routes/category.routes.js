const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getCategories);
router.post('/', authorize('admin'), createCategory);
router.put('/:id', authorize('admin'), updateCategory);
router.delete('/:id', authorize('admin'), deleteCategory);

module.exports = router;