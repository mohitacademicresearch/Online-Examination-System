import { useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';

const StudentFormModal = ({ student, onClose, onSaved }) => {
  const isEdit = Boolean(student);
  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    password: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email };
        if (form.password) payload.password = form.password;
        await api.put(`/users/students/${student._id}`, payload);
      } else {
        if (!form.password) {
          setError('A password is required for a new student account.');
          setSaving(false);
          return;
        }
        await api.post('/users/students', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit Student' : 'Add Student'}</h2>
        {error && <div className="admin-alert error">{error}</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="full">
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="full">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="full">
            <label htmlFor="password">{isEdit ? 'New password (leave blank to keep current)' : 'Password'}</label>
            <input
              id="password"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="full modal-actions">
            <button type="button" className="admin-btn-ghost admin-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFormModal;