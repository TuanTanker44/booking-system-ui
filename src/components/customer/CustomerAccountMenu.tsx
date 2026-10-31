import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../common/Avatar";
import { useUserStore } from "../../stores/user";
import "./CustomerAccountMenu.css";

export function CustomerAccountMenu({ onProfile }: { onProfile: () => void }) {
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const displayName = user?.fullName || user?.email || "Khách hàng";

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="customer-account-menu" ref={menuRef}>
      <button type="button" ref={buttonRef} className={`user-menu ${open ? "user-menu--open" : ""}`}
        aria-label="Tài khoản người dùng" aria-haspopup="menu" aria-expanded={open}
        aria-controls={open ? menuId : undefined} onClick={() => setOpen((value) => !value)}>
        <Avatar className="avatar small-avatar" name={displayName} src={user?.avatarUrl} />
        <span>{displayName}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="customer-account-dropdown" id={menuId} role="menu" aria-label="Tài khoản người dùng">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onProfile(); }}>
            <UserRound size={18} /><span>Thông tin cá nhân</span>
          </button>
          <div className="customer-account-dropdown__divider" role="separator" />
          <button type="button" role="menuitem" className="customer-account-dropdown__logout" onClick={() => void handleLogout()}>
            <LogOut size={18} /><span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}
