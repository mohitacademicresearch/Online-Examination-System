import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';

const emptyForm = {
  questionType: 'mcq',
  questionText: '',
  options: ['', '', '', ''],
  correctOption: 0,
  maxMarks: 1,
};

const TYPE_LABELS = { mcq: 'Multiple Choice', short: 'Short Answer', long: 'Long Answer / Code' };

const QuestionManager = ({ exam, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadQuestions = useCallback(async () => {
    const { data } = await api.get(`/questions/${exam._id}`);
    setQuestions(data);
  }, [exam._id]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleOptionChange = (index, value) => {
    const options = [...form.options];
    options[index] = value;
    setForm({ ...form, options });
  };

  const startEdit = (q) => {
    setEditingId(q._id);
    const paddedOptions = [...(q.options || [])];
    while (paddedOptions.length < 4) paddedOptions.push('');
    setForm({
      questionType: q.questionType || 'mcq',
      questionText: q.questionText,
      options: paddedOptions,
      correctOption: q.correctOption ?? 0,
      maxMarks: q.maxMarks ?? 1,
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.questionText.trim()) {
      setError('Enter the question text.');
      return;
    }

    let payload = {
      questionType: form.questionType,
      questionText: form.questionText,
      maxMarks: Number(form.maxMarks) || 1,
    };

    if (form.questionType === 'mcq') {
      const cleanOptions = form.options.map((o) => o.trim()).filter(Boolean);
      if (cleanOptions.length < 2) {
        setError('MCQ questions need at least 2 options.');
        return;
      }
      payload = { ...payload, options: cleanOptions, correctOption: Number(form.correctOption) };
    }

    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, payload);
      } else {
        await api.post(`/questions/${exam._id}`, payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save question.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    await api.delete(`/questions/${id}`);
    if (editingId === id) cancelEdit();
    loadQuestions();
  };

  return (
    <div>
      <button className="admin-btn-ghost admin-btn" onClick={onBack} style={{ marginBottom: 18 }}>
        ← Back to Manage Exams
      </button>
      <h2>Questions — {exam.title}</h2>
      <p className="admin-panel-sub">{questions.length} question(s) added so far.</p>

      {error && <div className="admin-alert error">{error}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="full">
          <label htmlFor="questionType">Question type</label>
          <select
            id="questionType"
            value={form.questionType}
            onChange={(e) => setForm({ ...form, questionType: e.target.value })}
          >
            <option value="mcq">Multiple Choice (auto-graded)</option>
            <option value="short">Short Answer (manually graded)</option>
            <option value="long">Long Answer / Code (manually graded)</option>
          </select>
        </div>

        <div className="full">
          <label htmlFor="questionText">{editingId ? 'Edit question' : 'Question'}</label>
          {form.questionType === 'long' ? (
            <textarea
              id="questionText"
              rows={3}
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              placeholder="e.g. Write a C program that prints 'Hello, World!' and explain the output."
            />
          ) : (
            <input
              id="questionText"
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
            />
          )}
        </div>

        {form.questionType === 'mcq' &&
          form.options.map((opt, idx) => (
            <div key={idx}>
              <label>
                Option {idx + 1} {Number(form.correctOption) === idx && '(correct)'}
              </label>
              <input value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} />
            </div>
          ))}

        {form.questionType === 'mcq' && (
          <div className="full">
            <label htmlFor="correctOption">Correct option</label>
            <select
              id="correctOption"
              value={form.correctOption}
              onChange={(e) => setForm({ ...form, correctOption: e.target.value })}
            >
              {form.options.map((_, idx) => (
                <option key={idx} value={idx}>
                  Option {idx + 1}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.questionType !== 'mcq' && (
          <div className="full admin-alert" style={{ background: 'rgba(201,162,39,0.1)', color: 'var(--ink)' }}>
            This is a subjective question — students will get a text box to type their answer (code, explanation,
            etc.). It won't be auto-scored; you'll grade it manually after the exam under the Grading tab.
          </div>
        )}

        <div>
          <label htmlFor="maxMarks">Marks for this question</label>
          <input
            id="maxMarks"
            type="number"
            min={1}
            value={form.maxMarks}
            onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
          />
        </div>

        <div className="full" style={{ display: 'flex', gap: 10 }}>
          <button className="admin-btn" type="submit" disabled={loading}>
            {loading ? 'Saving…' : editingId ? 'Save Changes' : 'Add Question'}
          </button>
          {editingId && (
            <button type="button" className="admin-btn-ghost admin-btn" onClick={cancelEdit}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <table className="admin-table" style={{ marginTop: 28 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Question</th>
            <th>Details</th>
            <th>Marks</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => (
            <tr key={q._id}>
              <td>{i + 1}</td>
              <td>{TYPE_LABELS[q.questionType || 'mcq']}</td>
              <td>{q.questionText}</td>
              <td>
                {(q.questionType || 'mcq') === 'mcq' ? (
                  q.options.map((o, idx) => (
                    <div key={idx} style={{ color: idx === q.correctOption ? 'var(--success)' : undefined }}>
                      {o} {idx === q.correctOption && '✓'}
                    </div>
                  ))
                ) : (
                  <span style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>Graded manually after submission</span>
                )}
              </td>
              <td>{q.maxMarks ?? 1}</td>
              <td>
                <div className="row-actions">
                  <button className="admin-btn-ghost admin-btn" onClick={() => startEdit(q)}>
                    Edit
                  </button>
                  <button className="admin-btn-danger admin-btn" onClick={() => handleDelete(q._id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {questions.length === 0 && <div className="admin-empty">No questions yet — add the first one above.</div>}
    </div>
  );
};

export default QuestionManager;