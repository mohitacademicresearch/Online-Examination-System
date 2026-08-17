import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ExamInstructions from './pages/ExamInstructions';
import ExamPage from './pages/ExamPage';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import StudentDashboard from './pages/StudentDashboard';
import StudentLogin from './pages/StudentLogin';
import StudentProfile from './pages/StudentProfile';
import StudentRegister from './pages/StudentRegister';
import ViewResult from './pages/ViewResult';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<StudentRegister />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exam/:id/instructions"
            element={
              <ProtectedRoute role="student">
                <ExamInstructions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:id"
            element={
              <ProtectedRoute role="student">
                <ExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:id/result"
            element={
              <ProtectedRoute role="student">
                <ViewResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;