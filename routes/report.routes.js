const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

// 📈 Dashboard APIs (Dono possible frontend hits safe handle kar liye hain)
router.get('/dashboard', reportController.getDashboardStats);
router.get('/dashboard-stats', reportController.getDashboardStats);

// 📊 Reports APIs
router.get('/sales', reportController.getSalesReport);
router.get('/top-products', reportController.getTopProductsReport);
router.get('/low-stock', reportController.getLowStockReport);

module.exports = router;