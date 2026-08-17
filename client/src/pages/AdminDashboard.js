import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityLogsView from '../components/admin/ActivityLogsView';
import CreateExamForm from '../components/admin/CreateExamForm';
import DashboardOverview from '../components/admin/DashboardOverview';
import GradingView from '../components/admin/GradingView';
import ManageExams from '../components/admin/ManageExams';
import ResultsView from '../components/admin/ResultsView';
import StudentsList from '../components/admin/StudentsList';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const TABS = [
  { key: 'overview', label: 'Overview', Component: DashboardOverview },
  { key: 'create', label: 'Create Exam', Component: CreateExamForm },
  { key: 'manage', label: 'Manage Exams', Component: ManageExams },
  { key: 'students', label: 'Students', Component: StudentsList },
  { key: 'grading', label: 'Grading', Component: GradingView },
  { key: 'results', label: 'Results', Component: ResultsView },
  { key: 'logs', label: 'Activity Logs', Component: ActivityLogsView },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    logout();
    navigate('/');
  };

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component;

  return (
    <div className="dash">
      <div className="dash-topbar">
        <div className="dash-brand">
          <span>◈</span> ExamGuard Admin
        </div>
        <div className="dash-user">
          <span className="dash-role-tag">Admin</span>
          <span>{user?.name}</span>
          <button className="dash-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-heading">
          <h1>Admin Dashboard</h1>
          <p>Create exams, add questions, and review student activity.</p>
        </div>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`admin-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-panel">{ActiveComponent && <ActiveComponent />}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;