import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Login } from './pages/Login';
import { MainLayout } from './layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Users } from './pages/Users';
import { CircleLibrary } from './pages/CircleLibrary';
import { ResourceLibrary } from './pages/ResourceLibrary';
import { AffirmationLibrary } from './pages/AffirmationLibrary';
import { Moderation } from './pages/Moderation';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import { Transactions } from './pages/Transactions';
import { Assessments } from './pages/Assessments';
import { AuditLogs } from './pages/AuditLogs';
import { Monetization } from './pages/Monetization';
import { isSupabaseConfigured, supabaseConfigError } from './lib/supabase';

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
          <Route path="/content" element={<Navigate to="/content/resources" replace />} />
          <Route path="/content/circles" element={<CircleLibrary />} />
          <Route path="/content/resources" element={<ResourceLibrary />} />
          <Route path="/content/affirmations" element={<AffirmationLibrary />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/monetization" element={<Monetization />} />
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
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300 mb-4">Admin Dashboard Setup</p>
          <h1 className="text-3xl font-bold mb-4">Environment configuration is missing</h1>
          <p className="text-white/80 leading-7 mb-4">
            The admin dashboard cannot start until its Supabase environment variables are set.
          </p>
          <div className="rounded-2xl bg-black/30 border border-white/10 p-4 text-sm text-white/80">
            {supabaseConfigError}
          </div>
          <div className="mt-6 text-sm text-white/70">
            Add the values from <code className="text-emerald-300">admin-dashboard/.env.example</code> into a local <code className="text-emerald-300">admin-dashboard/.env</code>.
          </div>
        </div>
      </div>
    );
  }

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
