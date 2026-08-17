import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';

const GradingDetail = ({ submissionId, onBack, onGraded }) => {
  const [submission, setSubmission] = useState(null);
  const [marks, setMarks] = useState({}); // questionId -> string input value
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/submissions/${submissionId}`).then(({ data }) => {
      setSubmission(data);
      const initial = {};
      data.answers.forEach((a) => {
        if (a.marksAwarded !== null && a.marksAwarded !== undefined) {
          initial[a.question._id] = String(a.marksAwarded);
        }
      });
      setMarks(initial);
    });
  }, [submissionId]);

  if (!submission) return <div>Loading submission…</div>;

  const subjectiveAnswers = submission.answers.filter(
    (a) => a.question && a.question.questionType !== 'mcq'
  );
  const mcqAnswers = submission.answers.filter((a) => a.question && a.question.questionType === 'mcq');

  const handleSave = async () => {
    setError('');
    const ungraded = subjectiveAnswers.filter((a) => marks[a.question._id] === undefined || marks[a.question._id] === '');
    if (ungraded.length > 0) {
      setError(`Please enter marks for all ${subjectiveAnswers.length} subjective question(s) before saving.`);
      return;
    }
    for (const a of subjectiveAnswers) {
      const value = Number(marks[a.question._id]);
      if (Number.isNaN(value) || value < 0 || value > a.question.maxMarks) {
        setError(`Marks for "${a.question.questionText.slice(0, 40)}…" must be between 0 and ${a.question.maxMarks}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        marks: subjectiveAnswers.map((a) => ({ questionId: a.question._id, marksAwarded: Number(marks[a.question._id]) })),
      };
      await api.put(`/submissions/${submissionId}/grade`, payload);
      onGraded();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save grades.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button className="admin-btn-ghost admin-btn" onClick={onBack} style={{ marginBottom: 18 }}>
        ← Back to pending list
      </button>
      <h2>
        {submission.student?.name} — {submission.exam?.title}
      </h2>
      <p className="admin-panel-sub">
        Submitted {new Date(submission.submittedAt).toLocaleString()} · {submission.violationCount} violation(s)
      </p>

      {error && <div className="admin-alert error">{error}</div>}

      {mcqAnswers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--slate)', marginBottom: 10 }}>
            Multiple choice (auto-graded, {mcqAnswers.reduce((s, a) => s + (a.marksAwarded || 0), 0)} /{' '}
            {mcqAnswers.reduce((s, a) => s + (a.question?.maxMarks || 0), 0)} marks)
          </h4>
        </div>
      )}

      {subjectiveAnswers.map((a) => (
        <div
          key={a.question._id}
          style={{ background: 'var(--paper)', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #e2e0d8' }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{a.question.questionText}</div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 10 }}>
            {a.question.questionType === 'long' ? 'Long Answer / Code' : 'Short Answer'} · Max {a.question.maxMarks} marks
          </div>
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid #e2e0d8',
              borderRadius: 8,
              padding: 14,
              fontFamily: a.question.questionType === 'long' ? 'var(--font-mono)' : 'var(--font-body)',
              fontSize: '0.88rem',
              whiteSpace: 'pre-wrap',
              marginBottom: 14,
              minHeight: 40,
            }}
          >
            {a.textAnswer?.trim() ? a.textAnswer : <em style={{ color: 'var(--slate)' }}>No answer submitted</em>}
          </div>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 6 }}>
            Marks awarded (0–{a.question.maxMarks})
          </label>
          <input
            type="number"
            min={0}
            max={a.question.maxMarks}
            value={marks[a.question._id] ?? ''}
            onChange={(e) => setMarks({ ...marks, [a.question._id]: e.target.value })}
            style={{ width: 120, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e0d8' }}
          />
        </div>
      ))}

      <button className="admin-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Grades'}
      </button>
    </div>
  );
};

const GradingView = () => {
  const [pending, setPending] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPending = useCallback(() => {
    setLoading(true);
    api
      .get('/submissions/pending')
      .then(({ data }) => setPending(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  if (selectedId) {
    return (
      <GradingDetail
        submissionId={selectedId}
        onBack={() => setSelectedId(null)}
        onGraded={() => {
          setSelectedId(null);
          loadPending();
        }}
      />
    );
  }

  return (
    <div>
      <h2>Grading</h2>
      <p className="admin-panel-sub">Submissions with short/long answer questions awaiting manual marks.</p>

      {loading && <div>Loading…</div>}

      {!loading && pending.length === 0 && (
        <div className="admin-empty">Nothing to grade right now — all subjective answers are marked.</div>
      )}

      {!loading && pending.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Exam</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pending.map((s) => (
              <tr key={s._id}>
                <td>
                  {s.student?.name} <span style={{ color: 'var(--slate)', fontSize: '0.8rem' }}>({s.student?.email})</span>
                </td>
                <td>{s.exam?.title}</td>
                <td>{new Date(s.submittedAt).toLocaleString()}</td>
                <td>
                  <button className="admin-btn" onClick={() => setSelectedId(s._id)}>
                    Grade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GradingView;