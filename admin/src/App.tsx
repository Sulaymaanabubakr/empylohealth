import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { MainLayout } from './layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';

import { Content } from './pages/Content';
import { Moderation } from './pages/Moderation';
import { Settings } from './pages/Settings';
import { Transactions } from './pages/Transactions';

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
          <Route path="/employees" element={<Employees />} />
          <Route path="/content" element={<Content />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/moderation" element={<Moderation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
