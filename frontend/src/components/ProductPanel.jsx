import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR',
    maximumFractionDigits: 0 
  }).format(amount || 0);
};

export default function ProductPanel() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    supplier: '',
    quantity: 0,
    price: 0,
    minStock: 5,
    unit: 'pcs'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodData, catData, supData] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/suppliers')
      ]);
      setProducts(prodData || []);
      setCategories(catData || []);
      setSuppliers(supData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' || name === 'minStock' ? Number(value) : value
    }));
  };

  // Click karne par agar value 0 hai toh usey khali karne ke liye function
  const handleFocus = (e) => {
    const { name, value } = e.target;
    if (Number(value) === 0) {
      setFormData(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Agar user input khali chhod kar bahar click kare, toh wapas 0 set karne ke liye function
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'minStock' ? 5 : 0 // minStock par default 5 aur baqi par 0
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('sku', formData.sku);
    data.append('category', formData.category);
    data.append('supplier', formData.supplier);
    data.append('quantity', Number(formData.quantity) || 0);
    data.append('price', Number(formData.price) || 0);
    data.append('minStock', Number(formData.minStock) || 5);
    data.append('unit', formData.unit || 'pcs');

    if (selectedFile) {
      data.append('image', selectedFile);
    }

    try {
      const url = editingId 
        ? `http://localhost:5000/api/products/${editingId}` 
        : 'http://localhost:5000/api/products';
        
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: data, 
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Server returned an error');
      }
      
      setShowForm(false);
      setEditingId(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setFormData({
        name: '',
        sku: '',
        category: '',
        supplier: '',
        quantity: 0,
        price: 0,
        minStock: 5,
        unit: 'pcs'
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id || product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category?._id || product.category || '',
      supplier: product.supplier?._id || product.supplier || '',
      quantity: product.quantity,
      price: product.price,
      minStock: product.minStock || 5,
      unit: product.unit || 'pcs'
    });
    setSelectedFile(null);
    setPreviewUrl(product.imageUrl ? `http://localhost:5000${product.imageUrl}` : null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  if (loading) return <p style={{ padding: '24px', color: '#64748b' }}>Loading products directory...</p>;
  if (error) return <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', margin: '24px' }}>{error}</div>;

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#1e293b', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Products Directory</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Manage your inventory items, stock levels, and pricing.</p>
        </div>
        <button 
          onClick={() => { 
            setShowForm(!showForm); 
            setEditingId(null); 
            setPreviewUrl(null);
            setSelectedFile(null);
          }}
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
          {showForm ? 'Cancel Process' : 'Add New Product'}
        </button>
      </div>

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
            {editingId ? 'Edit Product Details' : 'Create New Product'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Product Name</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleInputChange} required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>SKU / Barcode</label>
            <input 
              type="text" name="sku" value={formData.sku} onChange={handleInputChange} required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Category</label>
            <select name="category" value={formData.category} onChange={handleInputChange} required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none' }}
            >
              <option value="">-- Choose Category --</option>
              {categories.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Supplier</label>
            <select name="supplier" value={formData.supplier} onChange={handleInputChange} required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none' }}
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Price Input with Auto-Clear 0 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Price (PKR)</label>
            <input 
              type="number" name="price" value={formData.price} 
              onChange={handleInputChange} 
              onFocus={handleFocus}
              onBlur={handleBlur}
              required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          {/* Initial Stock Qty Input with Auto-Clear 0 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Initial Stock Qty</label>
            <input 
              type="number" name="quantity" value={formData.quantity} 
              onChange={handleInputChange} 
              onFocus={handleFocus}
              onBlur={handleBlur}
              required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          {/* Min Alert Stock Input with Auto-Clear 0 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Min Alert Stock</label>
            <input 
              type="number" name="minStock" value={formData.minStock} 
              onChange={handleInputChange} 
              onFocus={handleFocus}
              onBlur={handleBlur}
              required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Unit Measurement</label>
            <input 
              type="text" name="unit" value={formData.unit} onChange={handleInputChange} required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Product Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', flex: 1 }}
              />
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #cbd5e1' }}
                />
              )}
            </div>
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
            {editingId ? 'Update Product Information' : 'Save Product to Inventory'}
          </button>
        </form>
      )}

      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '40px' }}>📦</span>
            <p style={{ margin: '12px 0 0 0', fontWeight: '500' }}>No products found in the directory.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Click the "Add New Product" button above to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Image</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Product Details</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Supplier</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Stock Level</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Unit Price</th>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const isLowStock = p.quantity <= (p.minStock || 5);
                  const imgPath = p.imageUrl ? `http://localhost:5000${p.imageUrl}` : 'https://placehold.co/50x50?text=No+Img';
                  
                  return (
                    <tr key={p._id || p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <img 
                          src={imgPath} 
                          alt={p.name} 
                          style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        />
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{p.sku}</div>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#334155' }}>{p.category?.name || 'Uncategorized'}</td>
                      <td style={{ padding: '16px 20px', color: '#334155' }}>{p.supplier?.name || 'No Supplier'}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          background: isLowStock ? '#fee2e2' : '#dcfce7',
                          color: isLowStock ? '#991b1b' : '#15803d',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {p.quantity} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: '500', color: '#0f172a' }}>{formatCurrency(p.price)}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleEdit(p)}
                          style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', marginRight: '6px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(p._id || p.id)}
                          style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
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