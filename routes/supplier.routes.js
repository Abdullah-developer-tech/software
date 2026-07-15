const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Supplier Schema definition (In-file direct handle for safety)
const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' }
}, { timestamps: true });

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);

// 1. Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find({});
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body;
    const newSupplier = new Supplier({ name, contactPerson, phone, email, address });
    const saved = await newSupplier.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. Update supplier
router.put('/:id', async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 4. Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;