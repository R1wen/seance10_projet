import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-gray-400">Loading…</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-2xl font-bold text-red-500">403</p>
        <p className="text-gray-500">Admin access required.</p>
      </div>
    );
  }

  return <>{children}</>;
}
