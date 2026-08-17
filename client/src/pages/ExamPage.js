import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAntiCheat from '../hooks/useAntiCheat';
import api from '../services/api';
import './ExamPage.css';

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const isAnswered = (value) => value !== undefined && value !== null && value !== '';

const ExamPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const startKey = `examStart_${id}_${user._id}`;

  const [exam, setExam] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | in-progress | submitted
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [autoSubmitReason, setAutoSubmitReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const violationCountRef = useRef(0);
  const submittedRef = useRef(false);
  const examRef = useRef(null);
  const handleSubmitRef = useRef(() => {});

  useEffect(() => {
    api
      .get(`/exams/${id}/attempt`)
      .then(({ data }) => {
        setExam(data);
        examRef.current = data;

        let startedAt = localStorage.getItem(startKey);
        if (!startedAt) {
          startedAt = Date.now().toString();
          localStorage.setItem(startKey, startedAt);
        }
        const elapsed = Math.floor((Date.now() - Number(startedAt)) / 1000);
        const remaining = Math.max(data.duration * 60 - elapsed, 0);
        setSecondsLeft(remaining);
        setPhase('in-progress');
      })
      .catch((err) => {
        setLoadError(err.response?.data?.message || 'Could not load this exam.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (phase !== 'in-progress') return undefined;
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [phase]);

  const reEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      // browser may require another manual attempt
    }
  };

  const handleViolation = useCallback(
    (eventType, description) => {
      violationCountRef.current += 1;
      const count = violationCountRef.current;
      setViolationCount(count);

      const toastId = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id: toastId, description, count }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 4000);

      api.post(`/logs/${id}`, { eventType, description }).catch(() => {});

      const max = examRef.current?.maxViolations;
      if (max && max > 0 && count >= max) {
        setAutoSubmitReason(`You reached the maximum of ${max} recorded violations.`);
        handleSubmitRef.current();
      }
    },
    [id]
  );

  useAntiCheat(phase === 'in-progress', id, handleViolation);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError('');

    const payload = {
      answers: (examRef.current?.questions || [])
        .filter((q) => isAnswered(answers[q._id]))
        .map((q) =>
          q.questionType === 'mcq'
            ? { question: q._id, selectedOption: answers[q._id] }
            : { question: q._id, textAnswer: answers[q._id] }
        ),
      violationCount: violationCountRef.current,
    };

    try {
      const { data } = await api.post(`/submissions/${id}`, payload);
      setResult(data);
      setPhase('submitted');
      localStorage.removeItem(startKey);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not submit exam. Please try again.');
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [answers, id, startKey]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (phase === 'submitted' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'in-progress') return undefined;
    if (secondsLeft <= 0) {
      handleSubmit();
      return undefined;
    }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, secondsLeft, handleSubmit]);

  const selectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const setTextAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  if (loadError) {
    return (
      <div className="exam-screen">
        <div className="exam-intro">
          <h1>Can't open this exam</h1>
          <p>{loadError}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button className="dash-btn" onClick={() => navigate('/student-dashboard')}>
              Back to My Exams
            </button>
            <button
              className="dash-btn"
              style={{ background: 'transparent', color: 'var(--ink)', border: '1.5px solid #d8d5cb' }}
              onClick={() => navigate(`/exam/${id}/result`)}
            >
              View My Result
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'loading' || !exam) {
    return (
      <div className="exam-screen">
        <div className="exam-intro">Loading exam…</div>
      </div>
    );
  }

  if (phase === 'submitted') {
    return (
      <div className="exam-screen">
        <div className="exam-result">
          <h1>Exam submitted</h1>
          {autoSubmitReason && (
            <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Auto-submitted: {autoSubmitReason}</p>
          )}
          <p>{exam.title}</p>

          {result.status === 'pending_review' ? (
            <div className="admin-alert" style={{ background: 'rgba(201,162,39,0.12)', color: 'var(--ink)', marginTop: 16 }}>
              This exam includes questions that need manual grading. Your final score will be available under
              "My Exams" once your instructor has reviewed them.
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

          {result.violationCount > 0 && (
            <p style={{ color: 'var(--danger)', marginTop: 12 }}>
              {result.violationCount} activity violation(s) were recorded during this attempt.
            </p>
          )}
          <button className="dash-btn" onClick={() => navigate('/student-dashboard')}>
            Back to My Exams
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentIndex];
  const isLow = secondsLeft <= 60;

  return (
    <div className="exam-screen">
      <div className="exam-topbar">
        <span>{exam.title}</span>
        <span className={`exam-timer ${isLow ? 'low' : ''}`}>{formatTime(secondsLeft)}</span>
      </div>

      {!isFullscreen ? (
        <div className="fullscreen-lock-overlay">
          <div className="fullscreen-lock-box">
            <h2>You exited fullscreen</h2>
            <p>This has been recorded as a violation. You must return to fullscreen to continue the exam.</p>
            <button className="dash-btn" onClick={reEnterFullscreen}>
              Return to Fullscreen
            </button>
          </div>
        </div>
      ) : (
        <div className="exam-body">
          <div className="question-card">
            <div className="question-meta">
              Question {currentIndex + 1} of {exam.questions.length}
              {question.maxMarks > 1 && ` · ${question.maxMarks} marks`}
            </div>
            <div className="question-text">{question.questionText}</div>

            {question.questionType === 'mcq' && (
              <div className="option-list">
                {question.options.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`option-item ${answers[question._id] === idx ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={question._id}
                      checked={answers[question._id] === idx}
                      onChange={() => selectOption(question._id, idx)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {question.questionType === 'short' && (
              <input
                className="text-answer-input"
                type="text"
                value={answers[question._id] || ''}
                onChange={(e) => setTextAnswer(question._id, e.target.value)}
                placeholder="Type your answer…"
              />
            )}

            {question.questionType === 'long' && (
              <textarea
                className="text-answer-input code-answer"
                rows={10}
                value={answers[question._id] || ''}
                onChange={(e) => setTextAnswer(question._id, e.target.value)}
                placeholder="Type your answer or code here…"
                spellCheck={false}
              />
            )}

            <div className="question-nav">
              <button
                className="dash-btn"
                style={{ background: 'transparent', color: 'var(--ink)', border: '1.5px solid #d8d5cb' }}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                Previous
              </button>
              {currentIndex < exam.questions.length - 1 ? (
                <button className="dash-btn" onClick={() => setCurrentIndex((i) => i + 1)}>
                  Next
                </button>
              ) : (
                <button className="dash-btn" onClick={() => setConfirmOpen(true)} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Exam'}
                </button>
              )}
            </div>
          </div>

          <div className="palette">
            <h4>Questions</h4>
            <div className="palette-grid">
              {exam.questions.map((q, idx) => (
                <button
                  key={q._id}
                  className={`palette-item ${isAnswered(answers[q._id]) ? 'answered' : ''} ${
                    idx === currentIndex ? 'current' : ''
                  }`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            {exam.maxViolations > 0 && (
              <p style={{ fontSize: '0.76rem', color: 'var(--slate)', marginTop: 10 }}>
                Violations: {violationCount} / {exam.maxViolations}
              </p>
            )}
            <button className="submit-exam-btn" onClick={() => setConfirmOpen(true)} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Exam'}
            </button>
          </div>
        </div>
      )}

      {submitError && (
        <div className="toast-stack" style={{ bottom: 'auto', top: 90 }}>
          <div className="toast" style={{ borderLeftColor: 'var(--danger)' }}>
            <strong>Submission failed</strong>
            <div>{submitError}</div>
          </div>
        </div>
      )}

      {/* In-app confirmation modal — NOT window.confirm(). A native dialog
          here would force the browser to auto-exit fullscreen and blur the
          window, which is exactly the bug this replaces. */}
      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h2>Submit your exam?</h2>
            <p style={{ color: 'var(--slate)', marginBottom: 20 }}>
              You cannot make changes after this. Make sure you've answered everything you intend to.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="dash-btn" style={{ background: 'transparent', color: 'var(--ink)', border: '1.5px solid #d8d5cb' }} onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button
                className="dash-btn"
                onClick={() => {
                  setConfirmOpen(false);
                  handleSubmit();
                }}
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <strong>⚠ Violation {t.count} recorded.</strong>
            <div>{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamPage;