import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';
import Modal from './Modal.jsx';

const emptyForm = { name: '', email: '', password: '', role: 'staff' };

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUser = getUser();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', form);
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const changeRole = async (u, role) => {
    if (u._id === currentUser?.id) {
      alert("You can't change your own role.");
      return;
    }
    try {
      await api.put(`/users/${u._id}`, { role });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (u) => {
    if (u._id === currentUser?.id) {
      alert("You can't delete your own account.");
      return;
    }
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/users/${u._id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="muted">Loading users...</p>;

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <div className="toolbar">
        <div className="muted" style={{ fontSize: 13.5 }}>{users.length} accounts</div>
        <button className="btn btn-accent" onClick={openCreate}>
          + Add User
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">No users found.</div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>
                    {u.name}
                    {u._id === currentUser?.id && (
                      <span className="muted" style={{ fontSize: 11.5, marginLeft: 6 }}>
                        (you)
                      </span>
                    )}
                  </td>
                  <td className="muted">{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      disabled={u._id === currentUser?.id}
                      style={{ padding: '4px 6px', fontSize: 12.5 }}
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-accent' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="flex-row">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => toggleActive(u)}
                        disabled={u._id === currentUser?.id}
                      >
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u)}
                        disabled={u._id === currentUser?.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Add User" onClose={() => setShowModal(false)}>
          {formError && <div className="error-banner">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              className="btn btn-accent"
              type="submit"
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}