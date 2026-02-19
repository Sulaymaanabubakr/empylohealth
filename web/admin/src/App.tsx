import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Login } from './pages/Login';
import { MainLayout } from './layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Users } from './pages/Users';

import { Content } from './pages/Content';
import { Moderation } from './pages/Moderation';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import { Transactions } from './pages/Transactions';
import { Assessments } from './pages/Assessments';
import { AuditLogs } from './pages/AuditLogs';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const AppContent = () => {
  const { user, isAdmin } = useAuth();

  if (!user) return <Login />;
  if (!isAdmin) return <div className="h-screen flex items-center justify-center text-white bg-primary">Access Denied</div>;

  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/content" element={<Content />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/moderation" element={<Moderation />} />
          <Route path="/support" element={<Support />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
