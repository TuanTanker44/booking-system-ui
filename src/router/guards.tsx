import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser, hasAccessToken } from '../app/auth';
import type { UserRole } from '../types/auth';

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const user = getCurrentUser();

  if (!hasAccessToken() || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
