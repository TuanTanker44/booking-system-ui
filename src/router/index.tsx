import { Navigate, Route, Routes } from 'react-router-dom';
import { ForbiddenPage } from '../pages/common/ForbiddenPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { NotFoundPage } from '../pages/common/NotFoundPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import HomePage from '../pages/common/HomePage';
import { ProtectedRoute, PublicRoute } from './guards';
import { CustomerDashboardPage } from '../pages/customer/CustomerDashboardPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { StaffDashboardPage } from '../pages/staff/StaffDashboardPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin/users" element={<UserManagementPage />}/>
        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
      </Route>

      <Route element={<ProtectedRoute roles={['STAFF']} />}>
        <Route path="/staff" element={<StaffDashboardPage />} />
        <Route path="/staff/*" element={<Navigate to="/staff" replace />} />
      </Route>

      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
        <Route path="/customer/*" element={<Navigate to="/customer/dashboard" replace />} />
      </Route>
      
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      
      <Route path="/home" element={<HomePage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
