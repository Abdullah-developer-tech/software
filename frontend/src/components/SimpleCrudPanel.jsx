import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function SimpleCrudPanel({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Suppliers and Customers fields fallback
    phone: '',
    email: '',
    address: '',
    contactPerson: ''
  });

  // Dynamic naming based on prop type (categories, suppliers, customers)
  const isCategory = type === 'categories';
  const isSupplier = type === 'suppliers';
  const isCustomer = type === 'customers';

  const entityName = isCategory ? 'Category' : isSupplier ? 'Supplier' : 'Customer';

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/${type}`);
      setItems(data || []);
    } catch (err) {
      setError(err.message || `Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/${type}/${editingId}`, formData);
      } else {
        await api.post(`/${type}`, formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        phone: '',
        email: '',
        address: '',
        contactPerson: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id || item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      contactPerson: item.contactPerson || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${entityName}?`)) return;
    try {
      await api.delete(`/${type}/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  if (loading) return <p style={{ padding: '24px', color: '#64748b' }}>Loading {type}...</p>;
  if (error) return <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', margin: '24px' }}>{error}</div>;

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#1e293b', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>{entityName} Directory</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>Manage and organize your system's {type}.</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          style={{
            background: showForm ? '#64748b' : '#10b981',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Cancel' : `Add New ${entityName}`}
        </button>
      </div>

      {/* Dynamic Form */}
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
          <h3 style={{ gridColumn: '1 / -1', margin: 0, color: '#0f172a', fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            {editingId ? `📝 Edit ${entityName}` : `📁 Create New ${entityName}`}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{entityName} Name</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleInputChange} required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          {isCategory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Description</label>
              <input 
                type="text" name="description" value={formData.description} onChange={handleInputChange}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>
          )}

          {(isSupplier || isCustomer) && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Contact Person</label>
                <input 
                  type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Phone Number</label>
                <input 
                  type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Email Address</label>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleInputChange}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Physical Address</label>
                <input 
                  type="text" name="address" value={formData.address} onChange={handleInputChange}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </>
          )}

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
            marginTop: '10px'
          }}>
            {editingId ? `Update ${entityName}` : `Save ${entityName}`}
          </button>
        </form>
      )}

      {/* Directory Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {items.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '40px' }}>📁</span>
            <p style={{ margin: '12px 0 0 0', fontWeight: '500' }}>No record found in this directory.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Name</th>
                  {isCategory ? (
                    <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Description</th>
                  ) : (
                    <>
                      <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Contact Info</th>
                      <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600' }}>Address</th>
                    </>
                  )}
                  <th style={{ padding: '16px 20px', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id || item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#0f172a' }}>{item.name}</td>
                    {isCategory ? (
                      <td style={{ padding: '16px 20px', color: '#475569' }}>{item.description || '-'}</td>
                    ) : (
                      <>
                        <td style={{ padding: '16px 20px', color: '#475569' }}>
                          <div style={{ fontWeight: '500' }}>{item.contactPerson || '-'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.phone} | {item.email}</div>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#475569' }}>{item.address || '-'}</td>
                      </>
                    )}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleEdit(item)}
                        style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', marginRight: '6px', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id || item.id)}
                        style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}