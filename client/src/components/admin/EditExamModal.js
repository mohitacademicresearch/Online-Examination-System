import { useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';

// Converts an ISO date string to the value <input type="datetime-local"> expects
const toLocalInput = (isoString) => {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditExamModal = ({ exam, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: exam.title,
    description: exam.description || '',
    duration: exam.duration,
    passMark: exam.passMark ?? 40,
    maxViolations: exam.maxViolations ?? 5,
    startDate: toLocalInput(exam.startDate),
    endDate: toLocalInput(exam.endDate),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/exams/${exam._id}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update exam.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Exam</h2>
        {error && <div className="admin-alert error">{error}</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="full">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="full">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} value={form.description} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="duration">Duration (minutes)</label>
            <input id="duration" name="duration" type="number" min={5} value={form.duration} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="passMark">Pass mark (%)</label>
            <input id="passMark" name="passMark" type="number" min={0} max={100} value={form.passMark} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="maxViolations">Max violations (0 = no limit)</label>
            <input id="maxViolations" name="maxViolations" type="number" min={0} value={form.maxViolations} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="startDate">Opens at</label>
            <input id="startDate" name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="endDate">Closes at</label>
            <input id="endDate" name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} required />
          </div>

          <div className="full modal-actions">
            <button type="button" className="admin-btn-ghost admin-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExamModal;