import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import './ExamPage.css';

const ViewResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/submissions/mine/${id}`)
      .then(({ data }) => setResult(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load this result.'));
  }, [id]);

  if (error) {
    return (
      <div className="exam-screen">
        <div className="exam-intro">
          <h1>Can't show this result</h1>
          <p>{error}</p>
          <button className="dash-btn" style={{ marginTop: 20 }} onClick={() => navigate('/student-dashboard')}>
            Back to My Exams
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="exam-screen">
        <div className="exam-intro">Loading result…</div>
      </div>
    );
  }

  return (
    <div className="exam-screen">
      <div className="exam-result">
        <h1>{result.examTitle}</h1>
        <p>Submitted {new Date(result.submittedAt).toLocaleString()}</p>

        {result.status === 'pending_review' ? (
          <div className="admin-alert" style={{ background: 'rgba(201,162,39,0.12)', color: 'var(--ink)', marginTop: 16 }}>
            This exam includes questions still awaiting manual grading. Check back once your instructor has
            reviewed them.
          </div>
        ) : (
          <>
            <div className="score">
              {result.score} / {result.totalMarks}
            </div>
            <p style={{ color: result.passed ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {result.passed ? 'Passed' : 'Not passed'} — pass mark is {result.passMark}%
            </p>
          </>
        )}

        <p style={{ color: 'var(--slate)', marginTop: 12 }}>
          {result.violationCount} activity violation(s) were recorded during this attempt.
        </p>
        <button className="dash-btn" onClick={() => navigate('/student-dashboard')}>
          Back to My Exams
        </button>
      </div>
    </div>
  );
};

export default ViewResult;