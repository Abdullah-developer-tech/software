import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';
import Modal from './Modal.jsx';

// --- Inline Formatters to bypass missing "../lib/format" issue ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR',
    maximumFractionDigits: 0 
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const emptyLine = () => ({ product: '', quantity: 1, price: 0 });

const generateUniqueInvoiceNumber = () => {
  return 'INV-' + Math.floor(100000 + Math.random() * 900000);
};

export default function InvoicesPanel() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState(null);
  const isAdmin = getUser()?.role === 'admin';

  // --- Dynamic Invoice States ---
  const [invoiceNumber, setInvoiceNumber] = useState(''); 
  const [customer, setCustomer] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, prods, custs] = await Promise.all([
        api.get('/invoices'),
        api.get('/products'),
        api.get('/customers'),
      ]);
      setInvoices(inv || []);
      setProducts(prods || []);
      setCustomers(custs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setCustomer('');
    setLines([emptyLine()]);
    setDiscount(0);
    setTax(0);
    setAmountPaid(0);
    setFormError('');
    setInvoiceNumber(generateUniqueInvoiceNumber());
  };

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const updateLine = (idx, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'product') {
        const prod = products.find((p) => p._id === value || p.id === value);
        if (prod) {
          next[idx].price = prod.salePrice || prod.price || prod.sellingPrice || 0; 
        }
      }
      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleFocus = (value, setter) => {
    if (Number(value) === 0) {
      setter('');
    }
  };

  const handleBlur = (value, setter) => {
    if (value === '' || isNaN(value)) {
      setter(0);
    }
  };

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.quantity || 0) * Number(l.price || 0), 0),
    [lines]
  );
  const grandTotal = Math.max(subtotal - Number(discount || 0) + Number(tax || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const validLines = lines.filter((l) => l.product && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      setFormError('Add at least one valid product line.');
      return;
    }
    setSubmitting(true);
    
    try {
      // 🛡️ Bypass Mode: Mapping every possible field variable database might require
      const mappedItems = validLines.map((l) => {
        const prod = products.find((p) => p._id === l.product || p.id === l.product);
        const itemQty = Number(l.quantity) || 1;
        const itemPrice = Number(l.price) || 0;
        const itemName = prod ? prod.name : 'Product Item';
        
        return {
          product: l.product,
          productId: l.product, 
          
          name: itemName,
          productName: itemName,
          
          quantity: itemQty,
          qty: itemQty,
          
          price: itemPrice,
          unitPrice: itemPrice,
          
          total: itemQty * itemPrice,
          totalAmount: itemQty * itemPrice,
        };
      });

      const finalInvoiceNumber = invoiceNumber || generateUniqueInvoiceNumber();

      const payload = {
        invoiceNumber: finalInvoiceNumber,
        number: finalInvoiceNumber,
        
        customer: customer || undefined,
        customerId: customer || undefined,
        
        items: mappedItems,
        
        subtotal: Number(subtotal) || 0,
        subTotal: Number(subtotal) || 0,
        
        discount: Number(discount || 0),
        tax: Number(tax || 0),
        
        grandTotal: Number(grandTotal) || 0,
        totalAmount: Number(grandTotal) || 0,
        total: Number(grandTotal) || 0,
        
        amountPaid: Number(amountPaid || 0),
        paidAmount: Number(amountPaid || 0),
      };

      console.log("📤 Sending Complete Bypass Payload to Backend:", payload);

      await api.post('/invoices', payload);
      setShowCreate(false);
      load();
    } catch (err) {
      setFormError(err.message || 'Validation failed. Check your browser Network tab response.');
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async (invoice) => {
    try {
      await api.put(`/invoices/${invoice._id}`, { status: 'paid', amountPaid: invoice.grandTotal });
      load();
      if (viewing && viewing._id === invoice._id) setViewing({ ...viewing, status: 'paid' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice? Stock will not be restored automatically.')) return;
    try {
      await api.delete(`/invoices/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusBadge = (status) => {
    if (status === 'paid') return <span className="badge badge-accent">Paid</span>;
    if (status === 'partial') return <span className="badge badge-warn">Partial</span>;
    return <span className="badge badge-danger">Unpaid</span>;
  };

  if (loading) return <p className="muted" style={{ padding: '24px' }}>Loading invoices...</p>;

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <div className="toolbar">
        <div className="muted" style={{ fontSize: 13.5 }}>{invoices.length} invoices on record</div>
        <button className="btn btn-accent" onClick={openCreate}>
          + New Invoice
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">No invoices yet. Create your first invoice.</div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id}>
                  <td className="tabular" style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                  <td className="muted" style={{ fontSize: 12.5 }}>{formatDate(inv.createdAt)}</td>
                  <td>{inv.customer?.name || inv.customerNameSnapshot || 'Walk-in Customer'}</td>
                  <td className="tabular">{formatCurrency(inv.grandTotal)}</td>
                  <td>{statusBadge(inv.status)}</td>
                  <td>
                    <div className="flex-row">
                      <button className="btn btn-outline btn-sm" onClick={() => setViewing(inv)}>
                        View
                      </button>
                      {inv.status !== 'paid' && (
                        <button className="btn btn-accent btn-sm" onClick={() => markPaid(inv)}>
                          Mark Paid
                        </button>
                      )}
                      {isAdmin && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inv._id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal title={`New Invoice (${invoiceNumber})`} onClose={() => setShowCreate(false)}>
          {formError && <div className="error-banner">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Invoice Number</label>
              <input 
                type="text" 
                value={invoiceNumber} 
                disabled 
                style={{ background: '#f1f5f9', fontWeight: 'bold', color: '#0f172a' }} 
              />
            </div>

            <div className="field">
              <label>Customer (optional)</label>
              <select value={customer} onChange={(e) => setCustomer(e.target.value)}>
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>
              Items
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0 14px 0' }}>
              {lines.map((line, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 28px', gap: 6 }}>
                  <select
                    value={line.product}
                    onChange={(e) => updateLine(idx, 'product', e.target.value)}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id} disabled={p.quantity <= 0}>
                        {p.name} ({p.quantity} left)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                    onFocus={(e) => handleFocus(line.quantity, (val) => updateLine(idx, 'quantity', val))}
                    onBlur={(e) => handleBlur(line.quantity, (val) => updateLine(idx, 'quantity', val === 0 ? 1 : val))}
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.price}
                    onChange={(e) => updateLine(idx, 'price', e.target.value)}
                    onFocus={(e) => handleFocus(line.price, (val) => updateLine(idx, 'price', val))}
                    onBlur={(e) => handleBlur(line.price, (val) => updateLine(idx, 'price', val))}
                    placeholder="Price"
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                    style={{ padding: '5px 8px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline btn-sm" onClick={addLine}>
                + Add line
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Discount</label>
                <input 
                  type="number" 
                  min="0" 
                  value={discount} 
                  onChange={(e) => setDiscount(e.target.value)} 
                  onFocus={() => handleFocus(discount, setDiscount)}
                  onBlur={() => handleBlur(discount, setDiscount)}
                />
              </div>
              <div className="field">
                <label>Tax</label>
                <input 
                  type="number" 
                  min="0" 
                  value={tax} 
                  onChange={(e) => setTax(e.target.value)} 
                  onFocus={() => handleFocus(tax, setTax)}
                  onBlur={() => handleBlur(tax, setTax)}
                />
              </div>
            </div>
            <div className="field">
              <label>Amount Paid Now</label>
              <input
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                onFocus={() => handleFocus(amountPaid, setAmountPaid)}
                onBlur={() => handleBlur(amountPaid, setAmountPaid)}
              />
            </div>

            <div className="card" style={{ background: '#fafbfc', marginBottom: 14 }}>
              <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: 13.5 }}>
                <span className="muted">Subtotal</span>
                <span className="tabular">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex-row" style={{ justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 6 }}>
                <span>Grand Total</span>
                <span className="tabular">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              className="btn btn-accent"
              type="submit"
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={`Invoice ${viewing.invoiceNumber}`} onClose={() => setViewing(null)}>
          <div style={{ fontSize: 13.5 }}>
            <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div className="muted">Billed to</div>
                <div style={{ fontWeight: 600 }}>
                  {viewing.customer?.name || viewing.customerNameSnapshot || 'Walk-in Customer'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="muted">Date</div>
                <div>{formatDate(viewing.createdAt)}</div>
              </div>
            </div>

            <div className="table-wrap" style={{ marginBottom: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewing.items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.name}</td>
                      <td className="tabular">{it.quantity}</td>
                      <td className="tabular">{formatCurrency(it.price)}</td>
                      <td className="tabular">{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginLeft: 'auto', width: 220 }}>
              <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Subtotal</span>
                <span className="tabular">{formatCurrency(viewing.subtotal)}</span>
              </div>
              <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Discount</span>
                <span className="tabular">-{formatCurrency(viewing.discount)}</span>
              </div>
              <div className="flex-row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Tax</span>
                <span className="tabular">+{formatCurrency(viewing.tax)}</span>
              </div>
              <div className="flex-row" style={{ justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 6 }}>
                <span>Total</span>
                <span className="tabular">{formatCurrency(viewing.grandTotal)}</span>
              </div>
              <div className="flex-row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                <span className="muted">Status</span>
                {statusBadge(viewing.status)}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}