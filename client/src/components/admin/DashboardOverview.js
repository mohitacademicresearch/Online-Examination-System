import { useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';

const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <div>Loading overview…</div>;

  return (
    <div>
      <h2>Overview</h2>
      <p className="admin-panel-sub">A snapshot of the whole system.</p>

      <div className="stat-grid">
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="Total Exams" value={stats.totalExams} />
        <StatCard label="Total Questions" value={stats.totalQuestions} />
        <StatCard label="Exams Conducted" value={stats.examsConducted} />
        <StatCard label="Total Violations Recorded" value={stats.totalViolations} />
        <StatCard label="Pending Grading" value={stats.pendingGrading} />
      </div>

      <h3 style={{ fontSize: '0.95rem', marginTop: 32, marginBottom: 12 }}>Recently Completed Exams</h3>
      {stats.recentlyCompletedExams.length === 0 ? (
        <div className="admin-empty">No exams have been completed yet.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Exam</th>
              <th>Score</th>
              <th>Result</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentlyCompletedExams.map((r, i) => (
              <tr key={i}>
                <td>{r.student}</td>
                <td>{r.exam}</td>
                <td>
                  {r.status === 'graded' ? `${r.score} / ${r.totalMarks}` : '—'}
                </td>
                <td>
                  {r.status === 'graded' ? (
                    <span className={`status-pill ${r.passed ? 'status-published' : 'status-draft'}`}>
                      {r.passed ? 'Passed' : 'Not passed'}
                    </span>
                  ) : (
                    <span className="status-pill status-draft">Pending Grading</span>
                  )}
                </td>
                <td>{new Date(r.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DashboardOverview;