const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');

// @desc Get all stock transactions (optionally filter by product)
// @route GET /api/stock
exports.getTransactions = async (req, res) => {
  const { product, type } = req.query;
  const filter = {};
  if (product) filter.product = product;
  if (type) filter.type = type;

  const transactions = await StockTransaction.find(filter)
    .populate('product', 'name sku unit')
    .populate('performedBy', 'name role')
    .sort({ createdAt: -1 });
  res.json(transactions);
};

// @desc Record stock IN (purchase, return, adjustment)
// @route POST /api/stock/in
exports.stockIn = async (req, res) => {
  try {
    const { product, quantity, reason, reference, note } = req.body;
    if (!product || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Product and a positive quantity are required' });
    }

    const productDoc = await Product.findById(product);
    if (!productDoc) return res.status(404).json({ message: 'Product not found' });

    productDoc.quantity += Number(quantity);
    await productDoc.save();

    const transaction = await StockTransaction.create({
      product,
      type: 'in',
      quantity,
      reason: reason || 'purchase',
      reference,
      note,
      performedBy: req.user._id,
    });

    res.status(201).json({ transaction, newQuantity: productDoc.quantity });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc Record stock OUT (sale, damage, adjustment)
// @route POST /api/stock/out
exports.stockOut = async (req, res) => {
  try {
    const { product, quantity, reason, reference, note } = req.body;
    if (!product || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Product and a positive quantity are required' });
    }

    const productDoc = await Product.findById(product);
    if (!productDoc) return res.status(404).json({ message: 'Product not found' });

    if (productDoc.quantity < Number(quantity)) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${productDoc.quantity} ${productDoc.unit}`,
      });
    }

    productDoc.quantity -= Number(quantity);
    await productDoc.save();

    const transaction = await StockTransaction.create({
      product,
      type: 'out',
      quantity,
      reason: reason || 'sale',
      reference,
      note,
      performedBy: req.user._id,
    });

    res.status(201).json({ transaction, newQuantity: productDoc.quantity });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};