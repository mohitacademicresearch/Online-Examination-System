import { useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';

const CATEGORY_LABELS = {
  TAB_SWITCH: 'Tab Switch',
  FULLSCREEN_EXIT: 'Fullscreen Exit',
  COPY_ATTEMPT: 'Copy',
  PASTE_ATTEMPT: 'Paste',
  CUT_ATTEMPT: 'Cut',
  RIGHT_CLICK: 'Right Click',
  REFRESH_ATTEMPT: 'Refresh',
  DEV_TOOLS_ATTEMPT: 'Dev Tools',
  KEY_SHORTCUT: 'Other Shortcuts',
};
const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

const ActivityLogsView = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [summary, setSummary] = useState(null);
  const [drillDown, setDrillDown] = useState(null);
  const [drillLogs, setDrillLogs] = useState([]);

  useEffect(() => {
    api.get('/exams').then(({ data }) => setExams(data));
  }, []);

  useEffect(() => {
    setDrillDown(null);
    if (!examId) {
      setSummary(null);
      return;
    }
    api.get(`/logs/exam/${examId}/summary`).then(({ data }) => setSummary(data));
  }, [examId]);

  const openDrillDown = async (studentId, name) => {
    setDrillDown({ studentId, name });
    const { data } = await api.get(`/logs/exam/${examId}/student/${studentId}`);
    setDrillLogs(data);
  };

  return (
    <div>
      <h2>Activity Logs</h2>
      <p className="admin-panel-sub">Anti-cheating events recorded per student, broken down by category.</p>

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

      {summary && (
        <div className="stat-grid" style={{ marginBottom: 26 }}>
          {CATEGORY_KEYS.map((key) => (
            <div className="stat-card" key={key}>
              <div className="stat-value">{summary.totalsByType[key] || 0}</div>
              <div className="stat-label">{CATEGORY_LABELS[key]}</div>
            </div>
          ))}
        </div>
      )}

      {summary && summary.perStudent.length === 0 && (
        <div className="admin-empty">No violations recorded for this exam.</div>
      )}

      {summary && !drillDown && summary.perStudent.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              {CATEGORY_KEYS.map((key) => (
                <th key={key}>{CATEGORY_LABELS[key]}</th>
              ))}
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {summary.perStudent.map((s) => (
              <tr key={s.studentId}>
                <td>
                  {s.name} <span style={{ color: 'var(--slate)', fontSize: '0.8rem' }}>({s.email})</span>
                </td>
                {CATEGORY_KEYS.map((key) => (
                  <td key={key} className="violation-count">
                    {s.totalsByType[key] || 0}
                  </td>
                ))}
                <td className={`violation-count ${s.total >= 3 ? 'high' : ''}`}>{s.total}</td>
                <td>
                  <button className="admin-btn-ghost admin-btn" onClick={() => openDrillDown(s.studentId, s.name)}>
                    Timeline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {drillDown && (
        <div>
          <button className="admin-btn-ghost admin-btn" onClick={() => setDrillDown(null)} style={{ marginBottom: 16 }}>
            ← Back to list
          </button>
          <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>{drillDown.name}'s timeline</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {drillLogs.map((log) => (
                <tr key={log._id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td>{(CATEGORY_LABELS[log.eventType] || log.eventType.replace(/_/g, ' '))}</td>
                  <td style={{ color: 'var(--slate)' }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsView;