import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import './AdminPanel.css';
import StudentFormModal from './StudentFormModal';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const loadStudents = useCallback(async () => {
    const { data } = await api.get('/users/students');
    setStudents(data);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const openAdd = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.name}'s account? This also permanently deletes their exam submissions and activity logs, and cannot be undone.`)) return;
    await api.delete(`/users/students/${student._id}`);
    loadStudents();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Students</h2>
          <p className="admin-panel-sub">{students.length} registered student(s).</p>
        </div>
        <button className="admin-btn" onClick={openAdd}>
          + Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <div className="admin-empty">No students yet — add one above.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Registered</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="row-actions">
                    <button className="admin-btn-ghost admin-btn" onClick={() => openEdit(s)}>
                      Edit
                    </button>
                    <button className="admin-btn-danger admin-btn" onClick={() => handleDelete(s)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <StudentFormModal
          student={editingStudent}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadStudents();
          }}
        />
      )}
    </div>
  );
};

export default StudentsList;