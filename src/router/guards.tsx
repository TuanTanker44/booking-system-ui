import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "../stores/user.js";
import type { UserRole } from "../types/user";

export function ProtectedRoute({
  roles,
}: {
  roles?: UserRole[];
}) {
  const user = useUserStore((state) => state.user);
  const accessToken = useUserStore(
    (state) => state.accessToken,
  );
  const initialized = useUserStore(
    (state) => state.initialized,
  );

  if (!initialized) {
    return <div>Đang kiểm tra đăng nhập...</div>;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}