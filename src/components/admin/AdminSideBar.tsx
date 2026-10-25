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

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  {
    label: "Quản lý User",
    icon: Users,
    path: "/admin/users",
    active: true,
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
        {menuItems.map(({ label, icon: Icon, path, active }) => (
          <a
            key={path}
            href={path}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
              active
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={19} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}