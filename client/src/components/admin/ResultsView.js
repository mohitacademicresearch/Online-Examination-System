import { useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';

const ResultsView = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    api.get('/exams').then(({ data }) => setExams(data));
  }, []);

  useEffect(() => {
    if (!examId) {
      setSubmissions([]);
      return;
    }
    api.get(`/submissions/exam/${examId}`).then(({ data }) => setSubmissions(data));
  }, [examId]);

  const selectedExam = exams.find((e) => e._id === examId);

  return (
    <div>
      <h2>Results</h2>
      <p className="admin-panel-sub">Select an exam to see student scores.</p>

      <div className="exam-picker">
        <select value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="">Select an exam…</option>
          {exams.map((e) => (
            <option key={e._id} value={e._id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {examId && submissions.length === 0 && (
        <div className="admin-empty">No submissions for this exam yet.</div>
      )}

      {submissions.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Score</th>
              <th>Result</th>
              <th>Violations</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const percentage = s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0;
              const passed = percentage >= (selectedExam?.passMark ?? 40);
              return (
                <tr key={s._id}>
                  <td>{s.student?.name}</td>
                  <td>
                    {s.status === 'graded' ? `${s.score} / ${s.totalMarks}` : '—'}
                  </td>
                  <td>
                    {s.status === 'graded' ? (
                      <span className={`status-pill ${passed ? 'status-published' : 'status-draft'}`}>
                        {passed ? 'Passed' : 'Not passed'}
                      </span>
                    ) : (
                      <span className="status-pill status-draft">Pending Grading</span>
                    )}
                  </td>
                  <td className={`violation-count ${s.violationCount >= 3 ? 'high' : ''}`}>{s.violationCount || 0}</td>
                  <td>{new Date(s.submittedAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ResultsView;