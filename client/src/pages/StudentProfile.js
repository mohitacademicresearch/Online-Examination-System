import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';
import './Dashboard.css';

const StudentProfile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    logout();
    navigate('/');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload = { name };
      if (password) payload.password = password;
      const { data } = await api.put('/users/profile', payload);
      refreshUser?.(data);
      setPassword('');
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dash">
      <div className="dash-topbar">
        <div className="dash-brand">
          <span>◈</span> ExamGuard
        </div>
        <div className="dash-user">
          <span className="dash-role-tag">{user?.role}</span>
          <span>{user?.name}</span>
          <button className="dash-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="dash-body" style={{ maxWidth: 520 }}>
        <div className="dash-heading">
          <h1>My Profile</h1>
          <p>View your account details and update your name or password.</p>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: 28, marginTop: 28, boxShadow: 'var(--shadow-sm)' }}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          {success && (
            <div className="admin-alert success" style={{ marginBottom: 16 }}>
              {success}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSave}>
            <div className="field">
              <label>Email</label>
              <input value={user?.email || ''} disabled />
            </div>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">New password (leave blank to keep current)</label>
              <input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="auth-submit" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;