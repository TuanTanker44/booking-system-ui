import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { ForbiddenPage } from '../pages/common/ForbiddenPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { NotFoundPage } from '../pages/common/NotFoundPage';
import { HelpSupportPage } from '../pages/common/HelpSupportPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import { ProtectedRoute, PublicRoute } from './guards';
import { CustomerDashboardPage } from '../pages/customer/CustomerDashboardPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { EmailVerificationPage } from "../pages/auth/EmailVerificationPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { StaffDashboardPage } from '../pages/staff/StaffDashboardPage';
import { PaymentResultPage } from "../pages/customer/PaymentResultPage";
import StaffProfilePage from '../components/staff/profile/StaffProfilePage';

// Có token trên URL (link từ email) thì xác minh, không thì hiện màn nhắc kiểm tra email
function VerifyEmailRoute() {
  const [searchParams] = useSearchParams();

  return searchParams.has("token") ? (
    <VerifyEmailPage />
  ) : (
    <EmailVerificationPage />
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/help" element={<HelpSupportPage />} />

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin/users" element={<UserManagementPage />}/>
        <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
      </Route>

      <Route element={<ProtectedRoute roles={['STAFF']} />}>
        <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
        <Route path="/staff/bookings" element={<StaffDashboardPage />} />
        <Route path="/staff/services" element={<StaffDashboardPage />} />
        <Route path="/staff/machines" element={<StaffDashboardPage />} />
        <Route path="/staff/schedules" element={<StaffDashboardPage />} />
        <Route path="/staff/profile" element={<StaffProfilePage />} />
        <Route path="/staff/*" element={<Navigate to="/staff/dashboard" replace />} />
      </Route>

      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
        <Route path="/customer/*" element={<Navigate to="/customer/dashboard" replace />} />
      </Route>
      
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailRoute />} />
      </Route>

      <Route path="/payment/result" element={<PaymentResultPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
