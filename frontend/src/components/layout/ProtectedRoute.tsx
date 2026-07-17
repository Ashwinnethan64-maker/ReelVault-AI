import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading Vault...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
