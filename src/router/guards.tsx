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

export function PublicRoute() {
  const user = useUserStore((state) => state.user);
  const accessToken = useUserStore((state) => state.accessToken);
  const initialized = useUserStore((state) => state.initialized);

  // Chờ khôi phục phiên đăng nhập hoàn tất
  if (!initialized) {
    return <div>Đang kiểm tra đăng nhập...</div>;
  }

  // Chưa đăng nhập: cho phép truy cập trang công khai
  if (!accessToken || !user) {
    return <Outlet />;
  }

  // Đã đăng nhập: chuyển đến trang phù hợp với role
  switch (user.role) {
    case "ADMIN":
      return <Navigate to="/admin" replace />;

    case "STAFF":
      return <Navigate to="/staff" replace />;

    case "CUSTOMER":
      return <Navigate to="/customer/dashboard" replace />;

    default:
      return <Navigate to="/forbidden" replace />;
  }
}