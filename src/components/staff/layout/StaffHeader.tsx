import { Bell, ChevronDown, UserRound, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreSwitcher from "./StoreSwitcher";
import { Avatar } from "../../common/Avatar.js";
import { useUserStore } from "../../../stores/user.js";
import type { StoreOption } from "../../../types/staff";

type Props = {
  stores: StoreOption[];
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
};

export default function StaffHeader({
  stores,
  selectedStoreId,
  onStoreChange,
}: Props) {
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  const fullName = user?.fullName?.trim() || "Nhân viên";

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleProfileClick = () => {
    setIsAccountMenuOpen(false);
    navigate("/staff/profile");
  };

  const handleLogoutClick = async () => {
    setIsAccountMenuOpen(false);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    }
  };
  return (
    <header className="staff-header">
      <StoreSwitcher
        stores={stores}
        selectedStoreId={selectedStoreId}
        onChange={onStoreChange}
      />
      <div className="staff-header__right">
        <button
          type="button"
          className="icon-button notification-button"
          aria-label="Thông báo"
        >
          <Bell size={20} />
          <span className="notification-dot">3</span>
        </button>
        <div className="staff-account-menu" ref={accountMenuRef}>
  <button
    type="button"
    className={`staff-account ${
      isAccountMenuOpen ? "staff-account--open" : ""
    }`}
    aria-label="Tài khoản người dùng"
    aria-expanded={isAccountMenuOpen}
    aria-haspopup="menu"
    onClick={() => setIsAccountMenuOpen((prev) => !prev)}
  >
    <Avatar
      className="staff-avatar staff-avatar--blue"
      name={fullName}
      src={user?.avatarUrl}
    />

    <span className="staff-account__text">
      <small>Xin chào,</small>
      <strong>{fullName}</strong>
    </span>

    <ChevronDown
      className={`staff-account__chevron ${
        isAccountMenuOpen ? "staff-account__chevron--open" : ""
      }`}
      size={16}
    />
  </button>

  {isAccountMenuOpen && (
    <div className="staff-account-dropdown" role="menu">
      <button
        type="button"
        className="staff-account-dropdown__item"
        role="menuitem"
        onClick={handleProfileClick}
      >
        <UserRound size={18} />
        <span>Thông tin cá nhân</span>
      </button>

      <div className="staff-account-dropdown__divider" />

      <button
        type="button"
        className="staff-account-dropdown__item staff-account-dropdown__item--danger"
        role="menuitem"
        onClick={handleLogoutClick}
      >
        <LogOut size={18} />
        <span>Đăng xuất</span>
      </button>
    </div>
  )}
</div>
      </div>
    </header>
  );
}