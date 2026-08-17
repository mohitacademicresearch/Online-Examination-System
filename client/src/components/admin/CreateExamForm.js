import { useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';

const CreateExamForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: 30,
    passMark: 40,
    maxViolations: 5,
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/exams', form);
      setSuccess('Exam created as a draft. Publish it from Manage Exams once questions are added.');
      setForm({ title: '', description: '', duration: 30, passMark: 40, maxViolations: 5, startDate: '', endDate: '' });
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create exam.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Exam</h2>
      <p className="admin-panel-sub">
        New exams start as a draft. Add questions to it under Manage Exams, then publish.
      </p>

      {error && <div className="admin-alert error">{error}</div>}
      {success && <div className="admin-alert success">{success}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="full">
          <label htmlFor="title">Exam title</label>
          <input id="title" name="title" value={form.title} onChange={handleChange} required />
        </div>

        <div className="full">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="duration">Duration (minutes)</label>
          <input
            id="duration"
            name="duration"
            type="number"
            min={5}
            value={form.duration}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="passMark">Pass mark (%)</label>
          <input
            id="passMark"
            name="passMark"
            type="number"
            min={0}
            max={100}
            value={form.passMark}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="maxViolations">Max violations before auto-submit (0 = no limit)</label>
          <input
            id="maxViolations"
            name="maxViolations"
            type="number"
            min={0}
            value={form.maxViolations}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="startDate">Opens at</label>
          <input
            id="startDate"
            name="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="endDate">Closes at</label>
          <input
            id="endDate"
            name="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="full">
          <button className="admin-btn" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExamForm;