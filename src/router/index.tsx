import { Navigate, Route, Routes } from 'react-router-dom';
import { getCurrentUser, hasAccessToken } from '../app/auth';
import { AdminLayout } from '../layouts/AdminLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { StaffLayout } from '../layouts/StaffLayout';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { LoginPage } from '../pages/LoginPage';
import {
  AdminBookingsPage,
  AdminDashboardPage,
  AdminHotelsPage,
  AdminUsersPage,
  CustomerBookingsPage,
  CustomerHomePage,
  StaffBookingsPage,
  StaffDashboardPage,
  StaffHotelsPage,
} from '../pages/RolePages';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from './guards';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/hotels" element={<AdminHotelsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['STAFF']} />}>
        <Route element={<StaffLayout />}>
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/staff/bookings" element={<StaffBookingsPage />} />
          <Route path="/staff/hotels" element={<StaffHotelsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/customer" element={<CustomerHomePage />} />
          <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function HomeRedirect() {
  const user = getCurrentUser();

  if (!hasAccessToken() || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
}
