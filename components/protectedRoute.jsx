import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import IncomingCallHandler from './IncomingCallHandler.jsx';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <IncomingCallHandler />
      <Outlet />
    </>
  );
}
