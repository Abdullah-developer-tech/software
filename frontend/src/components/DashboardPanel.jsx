import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// --- Inline Helpers to Replace Missing "../lib/format" Mappings ---
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
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); // e.g., "15 Jul"
};

export default function DashboardPanel() {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const from = new Date();
        from.setDate(from.getDate() - 13);
        const [dashboard, salesReport] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get(`/reports/sales?from=${from.toISOString()}`),
        ]);
        setStats(dashboard);
        setSales(salesReport?.daily || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="muted">Loading dashboard...</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!stats) return null;

  // Safeguards to prevent crashes if dashboard arrays are undefined
  const lowStockItems = stats.lowStockItems || [];

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total Products</div>
          <div className="value tabular">{stats.totalProducts}</div>
        </div>
        <div className="stat-card accent">
          <div className="label">Inventory Value</div>
          <div className="value tabular">{formatCurrency(stats.totalStockValue)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Revenue This Month</div>
          <div className="value tabular">{formatCurrency(stats.revenueThisMonth)}</div>
        </div>
        <div className={`stat-card ${stats.lowStockCount > 0 ? 'warn' : ''}`}>
          <div className="label">Low Stock Items</div>
          <div className="value tabular">{stats.lowStockCount}</div>
        </div>
        <div className={`stat-card ${stats.outstandingAmount > 0 ? 'danger' : ''}`}>
          <div className="label">Outstanding Payments</div>
          <div className="value tabular">{formatCurrency(stats.outstandingAmount)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Invoices</div>
          <div className="value tabular">{stats.totalInvoices}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Revenue — last 14 days</h3>
          {sales.length === 0 ? (
            <p className="muted" style={{ fontSize: 13.5 }}>No sales recorded in this period yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => formatDate(d)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(d) => formatDate(d)}
                />
                <Bar dataKey="revenue" fill="#1f8a70" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Low Stock Alerts</h3>
          {lowStockItems.length === 0 ? (
            <p className="muted" style={{ fontSize: 13.5 }}>All products are well stocked.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lowStockItems.map((item) => (
                <div
                  key={item.id || item._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13.5,
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{item.sku}</div>
                  </div>
                  <span className="badge badge-warn">{item.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}