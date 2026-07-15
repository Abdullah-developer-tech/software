const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['in', 'out'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: {
      type: String,
      enum: ['purchase', 'sale', 'return', 'damage', 'adjustment', 'invoice'],
      default: 'adjustment',
    },
    reference: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
