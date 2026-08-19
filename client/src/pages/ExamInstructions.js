  import { useEffect, useState } from 'react';
  import { Link, useNavigate, useParams } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';
  import api from '../services/api';
  import './ExamPage.css';

  const ExamInstructions = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
      api
        .get(`/exams/${id}/attempt`)
        .then(({ data }) => setExam(data))
        .catch((err) => setError(err.response?.data?.message || 'Could not load this exam.'));
    }, [id]);

    const handleBegin = async () => {
      // Start the exam in fullscreen mode
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        // Some browsers restrict fullscreen the exam still proceeds.
      }
      // Record the attempt's real start time so the timer can resume correctly
      // even if the exam page gets refreshed later.
      localStorage.setItem(`examStart_${id}_${user._id}`, Date.now().toString());
      navigate(`/exam/${id}`);
    };

    if (error) {
      return (
        <div className="exam-screen">
          <div className="exam-intro">
            <h1>Can't open this exam</h1>
            <p>{error}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <Link to="/student-dashboard" className="dash-btn" style={{ display: 'inline-block' }}>
                Back to My Exams
              </Link>
              <Link
                to={`/exam/${id}/result`}
                className="dash-btn"
                style={{ display: 'inline-block', background: 'transparent', color: 'var(--ink)', border: '1.5px solid #d8d5cb' }}
              >
                View My Result
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (!exam) {
      return (
        <div className="exam-screen">
          <div className="exam-intro">Loading exam…</div>
        </div>
      );
    }

    return (
      <div className="exam-screen">
        <div className="exam-intro">
          <h1>{exam.title}</h1>
          <p>{exam.description}</p>
          <p>
            {exam.duration} minutes · {exam.questions.length} question(s) · Pass mark: {exam.passMark}%
          </p>

          <ul className="exam-intro-rules">
            <li>Once you begin, the exam runs in fullscreen. Exiting it is recorded, and you'll be required to return to fullscreen before you can continue.</li>
            <li>Switching tabs, minimizing, or losing window focus is detected and logged (counted once per switch).</li>
            <li>Copy, paste, right-click, and shortcuts like Ctrl+C/V/A/P/S are disabled and logged.</li>
            <li>Refreshing the page (F5, Ctrl+R, or the browser's Refresh button) and opening developer tools (F12, Ctrl+Shift+I/J/C, Ctrl+U) are blocked and logged.</li>
            <li>The browser's Back button is disabled during the exam.</li>
            <li>Trying to close or reload the tab will show a browser warning before you can leave.</li>
            {exam.maxViolations > 0 && (
              <li>
                If you reach <strong>{exam.maxViolations}</strong> recorded violations, the exam will be
                automatically submitted.
              </li>
            )}
            <li>The exam auto-submits when the timer reaches zero.</li>
            <li>You can only submit this exam once — there are no retakes.</li>
          </ul>

          <button className="dash-btn" style={{ marginTop: 24 }} onClick={handleBegin}>
            I understand — Begin Exam
          </button>
        </div>
      </div>
    );
  };

  export default ExamInstructions;