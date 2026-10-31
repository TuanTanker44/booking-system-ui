import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Store,
  CreditCard,
  Settings,
  Shirt,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserStore } from "../../stores/user";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  {
    label: "Quản lý User",
    icon: Users,
    path: "/admin/users",
  },
  {
    label: "Đơn đặt lịch",
    icon: CalendarDays,
    path: "/admin/bookings",
  },
  { label: "Cửa hàng", icon: Store, path: "/admin/stores" },
  {
    label: "Thanh toán",
    icon: CreditCard,
    path: "/admin/payments",
  },
  { label: "Cài đặt", icon: Settings, path: "/admin/settings" },
];

export default function AdminSidebar() {
  const logout = useUserStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-slate-950 text-white">
      <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
        <div className="rounded-xl bg-blue-600 p-2">
          <Shirt size={24} />
        </div>

        <div>
          <h1 className="font-bold">Laundry Admin</h1>
          <p className="text-xs text-slate-400">Management System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${isActive
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={19} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}