import { Navigate, Route, Routes } from 'react-router-dom';
import IntakePage from '@/routes/IntakePage';
import SuccessPage from '@/routes/SuccessPage';
import LoginPage from '@/routes/LoginPage';
import AdminDashboard from '@/routes/AdminDashboard';
import ClientDetailPage from '@/routes/ClientDetailPage';
import NotFound from '@/routes/NotFound';
import { RequireAuth } from '@/routes/RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/intake" replace />} />
      <Route path="/intake" element={<IntakePage />} />
      <Route path="/intake/success" element={<SuccessPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/clients/:id"
        element={
          <RequireAuth>
            <ClientDetailPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
