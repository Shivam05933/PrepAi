import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewArena from './pages/InterviewArena';
import ReportCard from './pages/ReportCard';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <InterviewArena />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportCard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;