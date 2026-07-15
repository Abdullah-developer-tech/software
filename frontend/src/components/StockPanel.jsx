import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// --- Inline Standard Formatters to Avoid Missing "../lib/format" Error ---
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

export default function StockPanel() {
  const [stockLogs, setStockLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    type: 'in', // 'in' or 'out'
    quantity: 1,
    reason: 'Purchase Restock' // default reason
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Backend should have a /stock or /stock-transactions route
      const [logsData, prodData] = await Promise.all([
        api.get('/stock'),
        api.get('/products')
      ]);
      setStockLogs(logsData || []);
      setProducts(prodData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch stock logs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product) {
      alert('Please select a product first!');
      return;
    }
    try {
      // POST request to record stock adjustment
      await api.post('/stock', formData);
      
      setShowForm(false);
      setFormData({
        product: '',
        type: 'in',
        quantity: 1,
        reason: 'Purchase Restock'
      });
      fetchData(); // Reload table and quantities
    } catch (err) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  if (loading) return <p style={{ padding: '24px', color: '#64748b' }}>Loading stock logs...</p>;
  if (error) return <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', margin: '24px' }}>{error}</div>;

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#1e293b', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Stock In / Out Ledger</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Record product restocking (Stock In) or inventory deductions (Stock Out).</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? '#64748b' : '#10b981',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          {showForm ? 'Cancel' : 'New Stock Adjustment'}
        </button>
      </div>

      {/* Stock Adjustment Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px'
        }}>
          <h3 style={{ gridColumn: '1 / -1', margin: '0 0 4px 0', color: '#0f172a', fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            ⚡ Record Stock Transaction
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Select Product</label>
            <select name="product" value={formData.product} onChange={handleInputChange} required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none' }}
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} (Current: {p.quantity} {p.unit || 'pcs'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Transaction Type</label>
            <select name="type" value={formData.type} onChange={handleInputChange} required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none' }}
            >
              <option value="in">🟢 Stock In (Add to Inventory)</option>
              <option value="out">🔴 Stock Out (Reduce from Inventory)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Quantity</label>
            <input 
              type="number" name="quantity" min="1" value={formData.quantity} onChange={handleInputChange} required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Reason / Notes</label>
            <input 
              type="text" name="reason" value={formData.reason} onChange={handleInputChange} required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              placeholder="e.g. Received new shipment, Damaged stock, Sale"
            />
          </div>

          <button type="submit" style={{
            gridColumn: '1 / -1',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '10px',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
          }}>
            Submit Stock Adjustment
          </button>
        </form>
      )}

      {/* History Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {stockLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '40px' }}>📊</span>
            <p style={{ margin: '12px 0 0 0', fontWeight: '500' }}>No stock logs found.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Create an adjustment to see transaction histories here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Product Details</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Action Type</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Adjusted Qty</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {stockLogs.map(log => {
                  const isStockIn = log.type === 'in';
                  return (
                    <tr key={log._id || log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '16px 20px', color: '#475569' }}>{formatDate(log.createdAt)}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{log.product?.name || 'Unknown Product'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>SKU: {log.product?.sku || '-'}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          background: isStockIn ? '#dcfce7' : '#fee2e2',
                          color: isStockIn ? '#15803d' : '#b91c1c',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {isStockIn ? '🟢 STOCK IN' : '🔴 STOCK OUT'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: '#0f172a' }}>
                        {isStockIn ? '+' : '-'}{log.quantity}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#475569' }}>{log.reason || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}