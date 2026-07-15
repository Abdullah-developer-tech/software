const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, customerName, customerPhone, items, totalAmount, discountAmount, status } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    for (const i of items) {
      if (!i.product || !mongoose.Types.ObjectId.isValid(i.product)) {
        return res.status(400).json({ message: 'Invalid product id in items' });
      }
    }

    const newInvoice = new Invoice({
      invoiceNumber,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items: items.map((i) => ({
        product: new mongoose.Types.ObjectId(i.product),
        quantity: Number(i.quantity),
        price: Number(i.price),
      })),
      totalAmount,
      discountAmount,
      status: status || 'Paid',
      createdBy: req.user._id,
    });

    await newInvoice.save();

    // Deduct stock for a new sale
    for (const i of items) {
      await Product.findByIdAndUpdate(i.product, { $inc: { stock: -Number(i.quantity) } });
    }

    res.status(201).json(newInvoice);
  } catch (err) {
    console.error('createInvoice error:', err);
    res.status(500).json({ message: err.message });
  }
};

const getInvoices = async (req, res) => {
  try {
    const inv = await Invoice.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(inv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInvoiceByNumber = async (req, res) => {
  try {
    const inv = await Invoice.findOne({ invoiceNumber: req.params.invNum })
      .populate('items.product', 'name price stock'); // <-- yeh line missing thi, isi wajah se error aata tha
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json(inv);
  } catch (err) {
    console.error('getInvoiceByNumber error:', err);
    res.status(500).json({ message: err.message });
  }
};

const returnInvoice = async (req, res) => {
  try {
    const { invoiceId, items } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId) || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const inv = await Invoice.findById(invoiceId);
    if (!inv) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (inv.status === 'Returned') {
      return res.status(400).json({ message: 'This invoice has already been returned' });
    }

    for (const i of items) {
      if (i.product && mongoose.Types.ObjectId.isValid(i.product) && Number(i.quantity) > 0) {
        await Product.findByIdAndUpdate(i.product, { $inc: { stock: Number(i.quantity) } });
      }
    }

    inv.status = 'Returned';
    await inv.save();
    res.json({ message: 'Success' });
  } catch (err) {
    console.error('returnInvoice error:', err);
    res.status(500).json({ message: err.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id).populate('items.product', 'name price stock');
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json(inv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const inv = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json(inv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getInvoiceByNumber,
  returnInvoice,
};