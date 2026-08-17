import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';
import EditExamModal from './EditExamModal';
import QuestionManager from './QuestionManager';

const ManageExams = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);

  const loadExams = useCallback(async () => {
    const { data } = await api.get('/exams');
    setExams(data);
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const togglePublish = async (exam) => {
    await api.put(`/exams/${exam._id}`, { isPublished: !exam.isPublished });
    loadExams();
  };

  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}"? This also deletes its questions.`)) return;
    await api.delete(`/exams/${exam._id}`);
    loadExams();
  };

  if (selectedExam) {
    return <QuestionManager exam={selectedExam} onBack={() => { setSelectedExam(null); loadExams(); }} />;
  }

  return (
    <div>
      <h2>Manage Exams</h2>
      <p className="admin-panel-sub">Add questions, edit details, then publish so students can see it.</p>

      {exams.length === 0 ? (
        <div className="admin-empty">No exams yet — create one from the Create Exam tab.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Duration</th>
              <th>Pass Mark</th>
              <th>Window</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam._id}>
                <td>{exam.title}</td>
                <td>{exam.duration} min</td>
                <td>{exam.passMark ?? 40}%</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>
                  {new Date(exam.startDate).toLocaleString()} → {new Date(exam.endDate).toLocaleString()}
                </td>
                <td>
                  <span className={`status-pill ${exam.isPublished ? 'status-published' : 'status-draft'}`}>
                    {exam.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="admin-btn-ghost admin-btn" onClick={() => setSelectedExam(exam)}>
                      Questions
                    </button>
                    <button className="admin-btn-ghost admin-btn" onClick={() => setEditingExam(exam)}>
                      Edit
                    </button>
                    <button className="admin-btn-ghost admin-btn" onClick={() => togglePublish(exam)}>
                      {exam.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="admin-btn-danger admin-btn" onClick={() => handleDelete(exam)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingExam && (
        <EditExamModal
          exam={editingExam}
          onClose={() => setEditingExam(null)}
          onSaved={() => {
            setEditingExam(null);
            loadExams();
          }}
        />
      )}
    </div>
  );
};

export default ManageExams;