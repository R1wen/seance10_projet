import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-gray-400">Loading…</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
