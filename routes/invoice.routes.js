const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getInvoiceByNumber,
  returnInvoice,
} = require('../controllers/invoice.controller');
const { protect } = require('../middleware/auth'); // apne actual auth middleware ka path/naam yahan confirm kar lein

router.use(protect);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.post('/return', returnInvoice);
router.get('/number/:invNum', getInvoiceByNumber);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoiceStatus);

module.exports = router;