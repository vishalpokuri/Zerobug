import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CanvasPage } from './pages/CanvasPage';
import { GitHubImportPage } from './pages/GitHubImportPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/canvas/:projectId" 
          element={
            <ProtectedRoute>
              <CanvasPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/import" 
          element={
            <ProtectedRoute>
              <GitHubImportPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
