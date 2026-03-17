import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Attributes from './pages/Attributes';
import AuditLogs from './pages/AuditLogs';
import ApiKeys from './pages/ApiKeys';
import Settings from './pages/Settings';
import AdminManagement from './pages/AdminManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="api-keys" element={<ApiKeys />} />
            <Route path="settings" element={<Settings />} />

            {/* Admin Console */}
            <Route path="admin/users" element={
              <ProtectedRoute adminOnly><Users /></ProtectedRoute>
            } />
            <Route path="admin/roles" element={
              <ProtectedRoute adminOnly><Roles /></ProtectedRoute>
            } />
            <Route path="admin/attributes" element={
              <ProtectedRoute adminOnly><Attributes /></ProtectedRoute>
            } />
            <Route path="admin/admins" element={
              <ProtectedRoute adminOnly><AdminManagement /></ProtectedRoute>
            } />
            <Route path="admin/audit-logs" element={
              <ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute>
            } />

            {/* Legacy redirects */}
            <Route path="users" element={<Navigate to="/admin/users" replace />} />
            <Route path="roles" element={<Navigate to="/admin/roles" replace />} />
            <Route path="audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
