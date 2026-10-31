import type { ReactNode } from "react";
import { Bell, UserCircle } from "lucide-react";
import AdminSidebar from "./AdminSideBar";
import { useUserStore } from "../../stores/user";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const user = useUserStore((state) => state.user);

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
          <div>
            <p className="text-sm text-slate-500">
              Laundry Booking System
            </p>
            <p className="font-semibold text-slate-800">
              Administration
            </p>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              aria-label="Thông báo"
              className="text-slate-500 hover:text-blue-600"
            >
              <Bell size={21} />
            </button>

            <div className="flex items-center gap-2.5">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="size-9 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <UserCircle size={34} className="text-blue-600" />
              )}

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.fullName || "Administrator"}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.email || "Quản trị viên"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}