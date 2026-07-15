import { useState } from 'react';
import { api } from '../lib/api';
import { saveSession } from '../lib/auth';

export default function LoginForm() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };
      const data = await api.post(path, body);
      saveSession(data.token, data.user);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span className="mark">SM</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
              Stock Manager
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Inventory & invoicing
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginBottom: 4 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create the first admin account'}
        </h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
          {mode === 'login'
            ? 'Enter your credentials to continue.'
            : 'This will be the first user and becomes an Admin automatically.'}
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label>Full name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>
          <button className="btn btn-accent" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Admin Account'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
          >
            {mode === 'login' ? 'First time setup? Create admin account' : 'Back to sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}