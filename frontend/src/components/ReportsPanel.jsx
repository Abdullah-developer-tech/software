import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

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

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPanel() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [sales, setSales] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [salesReport, topReport] = await Promise.all([
        api.get(`/reports/sales?from=${from}&to=${to}`),
        api.get(`/reports/top-products?from=${from}&to=${to}`),
      ]);
      setSales(salesReport);
      setTopProducts(topReport);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    load();
  };

  const exportCsv = () => {
    if (!sales?.daily?.length) return;
    const header = 'Date,Revenue,Invoices\n';
    const rows = sales.daily
      .map((d) => `${d.date},${d.revenue},${d.invoiceCount || 0}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleFilter} className="toolbar" style={{ flexWrap: 'wrap' }}>
        <div className="field" style={{ margin: 0 }}>
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-accent" type="submit">
          Apply
        </button>
        <button className="btn btn-outline" type="button" onClick={exportCsv}>
          Export CSV
        </button>
      </form>

      {loading ? (
        <p className="muted">Loading report...</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card accent">
              <div className="label">Total Revenue</div>
              <div className="value tabular">{formatCurrency(sales?.totalRevenue || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Invoices in Range</div>
              <div className="value tabular">{sales?.invoiceCount || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">Avg. Invoice Value</div>
              <div className="value tabular">
                {formatCurrency(
                  sales?.invoiceCount ? sales.totalRevenue / sales.invoiceCount : 0
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Revenue Trend</h3>
              {!sales?.daily?.length ? (
                <p className="muted" style={{ fontSize: 13.5 }}>No sales in this date range.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={sales.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => formatDate(d)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(d) => formatDate(d)}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1f8a70"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Top Products</h3>
              {topProducts.length === 0 ? (
                <p className="muted" style={{ fontSize: 13.5 }}>No product sales yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip formatter={(value) => value} />
                    <Bar dataKey="unitsSold" fill="#1f8a70" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">No data for this range.</div>
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p) => (
                    <tr key={p.productId || p.name}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td className="tabular">{p.unitsSold}</td>
                      <td className="tabular">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}