const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  quantity: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 },
  minStock: { type: Number, required: true, default: 5 },
  unit: { type: String, default: 'pcs' },
  imageUrl: { type: String, default: '' } // This is crucial for saving image path
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);