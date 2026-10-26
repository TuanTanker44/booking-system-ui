import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../stores/user.js";

export function StaffDashboardPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <section className="center-page">
      <div className="card">
        <h1>Khu vực nhân viên</h1>
        <p>Xin chào {user?.fullName ?? user?.email}.</p>
        <p>Trang quản lý dành cho nhân viên đang được phát triển.</p>
        <button type="button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </section>
  );
}
