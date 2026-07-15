const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const upload = require('../middleware/upload');

// 1. Get all products (With Categories & Suppliers Populated)
router.get('/', productController.getProducts);

// 2. Create a new product (Multipart form handler triggers controller dynamic stock logger)
router.post('/', upload.single('image'), productController.createProduct);

// 3. Update existing product (Accepts new image file uploads safely)
router.put('/:id', upload.single('image'), productController.updateProduct);

// 4. Delete product from index
router.delete('/:id', productController.deleteProduct);

module.exports = router;