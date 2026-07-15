const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerName: { type: String, default: 'Walk-in Customer', trim: true },
    customerPhone: { type: String, default: '', trim: true },
    items: { type: [invoiceItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Partial', 'Returned'],
      default: 'Paid',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);