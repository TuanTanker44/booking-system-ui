import {
  LayoutDashboard,
  ClipboardList,
  Shirt,
  WashingMachine,
  CalendarDays,
  MessageSquareWarning,
  ChevronLeft,
} from "lucide-react";
import { NavLink } from "react-router-dom";

type StaffSidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
  activeSection?: "dashboard" | "bookings";
  onSectionChange?: (section: "dashboard" | "bookings") => void;
};

const navItems = [
  {
    label: "Tổng quan",
    path: "/staff/dashboard",
    section: "dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Đơn hàng",
    path: "/staff/bookings",
    section: "bookings",
    icon: ClipboardList,
  },
  {
    label: "Dịch vụ",
    path: "/staff/services",
    icon: Shirt,
  },
  {
    label: "Máy giặt",
    path: "/staff/machines",
    icon: WashingMachine,
  },
  {
    label: "Lịch hoạt động",
    path: "/staff/schedules",
    icon: CalendarDays,
  },
  {
    label: "Khiếu nại",
    path: "/staff/complaints",
    icon: MessageSquareWarning,
  },
] as const;

export default function StaffSidebar({
  collapsed = false,
  onToggle,
  activeSection,
  onSectionChange,
}: StaffSidebarProps) {
  return (
    <aside
      className={`staff-sidebar ${
        collapsed ? "staff-sidebar--collapsed" : ""
      }`}
    >
      <div className="staff-sidebar__brand">
        <div className="staff-sidebar__logo">
          <WashingMachine size={24} />
        </div>

        {!collapsed && (
          <div className="staff-sidebar__brand-text">
            <strong>Laundry <span>Booking</span></strong>
            <span>STAFF PORTAL</span>
          </div>
        )}
      </div>

      <div className="staff-sidebar__section-label">
        {!collapsed && "MENU CHÍNH"}
      </div>

      <nav className="staff-sidebar__nav">
        {navItems.map((item) =>
          "section" in item && onSectionChange ? (
            <button
              key={item.label}
              type="button"
              title={collapsed ? item.label : undefined}
              aria-current={
                activeSection === item.section ? "page" : undefined
              }
              className={`staff-sidebar__link ${
                activeSection === item.section
                  ? "staff-sidebar__link--active"
                  : ""
              }`}
              onClick={() => onSectionChange(item.section)}
            >
              <item.icon size={20} />
              {!collapsed && (
                <span className="staff-sidebar__link-label">
                  {item.label}
                </span>
              )}
            </button>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `staff-sidebar__link ${
                  ("section" in item
                    ? activeSection === item.section
                    : isActive)
                    ? "staff-sidebar__link--active"
                    : ""
                }`
              }
            >
              <item.icon size={20} />
              {!collapsed && (
                <span className="staff-sidebar__link-label">
                  {item.label}
                </span>
              )}
            </NavLink>
          ),
        )}
      </nav>

      {onToggle && (
        <button
          type="button"
          className="staff-sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <ChevronLeft
            size={18}
            className={
              collapsed ? "staff-sidebar__toggle-icon--collapsed" : ""
            }
          />

          {!collapsed && <span>Thu gọn menu</span>}
        </button>
      )}
    </aside>
  );
}
