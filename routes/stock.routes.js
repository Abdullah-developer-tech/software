const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Product = mongoose.models.Product;
const StockLog = mongoose.models.StockLog || mongoose.model('StockLog', new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, default: '' }
}, { timestamps: true }));

// 1. Get All Stock Logs
router.get('/', async (req, res) => {
  try {
    const logs = await StockLog.find({})
      .populate('product', 'name sku quantity unit')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Create Stock Transaction & AUTO-UPDATE Product Quantity (Local Safe Version)
router.post('/', async (req, res) => {
  try {
    const { product, type, quantity, reason } = req.body;
    const qtyChange = Number(quantity);

    // Find Product First
    const dbProduct = await Product.findById(product);
    if (!dbProduct) {
      return res.status(404).json({ message: 'Product not found!' });
    }

    // Calculate & Apply New Quantity
    if (type === 'in') {
      dbProduct.quantity = (dbProduct.quantity || 0) + qtyChange;
    } else if (type === 'out') {
      if ((dbProduct.quantity || 0) < qtyChange) {
        return res.status(400).json({ 
          message: `Invalide Quantity! Current stock is only ${dbProduct.quantity}. You cannot stock out ${qtyChange}.` 
        });
      }
      dbProduct.quantity = (dbProduct.quantity || 0) - qtyChange;
    }

    // Save Updated Product Quantity
    await dbProduct.save();

    // Create Stock Log
    const newLog = new StockLog({ product, type, quantity: qtyChange, reason });
    const savedLog = await newLog.save();

    res.status(201).json(savedLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;