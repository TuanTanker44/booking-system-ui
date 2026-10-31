import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AuthService } from "../../../services/auth.js";
import { Avatar } from "../../../components/common/Avatar";
import "./StaffProfilePage.css";

type StaffProfile = {
  id?: number | string;
  fullName?: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

type PasswordField = "current" | "next" | "confirm";

const PASSWORD_RULES = [
  {
    id: "length",
    label: "Ít nhất 8 ký tự",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "Có chữ hoa",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Có chữ thường",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Có chữ số",
    test: (value: string) => /\d/.test(value),
  },
];

export default function StaffProfilePage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notification, setNotification] = useState("");
  const notificationTimeout = useRef<number | null>(null);

  function notify(message: string) {
    setNotification(message);

    if (notificationTimeout.current !== null) {
      window.clearTimeout(notificationTimeout.current);
    }

    notificationTimeout.current = window.setTimeout(() => {
      setNotification("");
      notificationTimeout.current = null;
    }, 2600);
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await AuthService.getMe();

        if (active) {
          setUser(response);
        }
      } catch {
        if (active) {
          setLoadError("Không thể tải thông tin cá nhân.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(
    () => () => {
      if (notificationTimeout.current !== null) {
        window.clearTimeout(notificationTimeout.current);
      }
    },
    [],
  );

  return (
    <main className="staff-profile-page">
      <ProfileHeading />
      {loading ? (
        <section className="staff-profile-panel">
          <p className="staff-profile-status">
            Đang tải thông tin cá nhân...
          </p>
        </section>
      ) : loadError || !user ? (
        <section className="staff-profile-panel">
          <div className="staff-profile-status" role="alert">
            <p>{loadError || "Không có dữ liệu người dùng."}</p>
            <button
              type="button"
              className="staff-profile-button"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Thử lại
            </button>
          </div>
        </section>
      ) : (
        <StaffProfileContent user={user} notify={notify} />
      )}
      {notification && (
        <div className="staff-profile-toast" role="status" aria-live="polite">
          <Info size={18} />
          {notification}
        </div>
      )}
    </main>
  );
}

function ProfileHeading() {
  return (
    <div className="staff-profile-heading">
      <div>
        <span className="staff-profile-eyebrow">TÀI KHOẢN NHÂN VIÊN</span>
        <h1>Thông tin cá nhân</h1>
        <p>Quản lý thông tin tài khoản và bảo mật của bạn.</p>
      </div>
    </div>
  );
}

function StaffProfileContent({
  user,
  notify,
}: {
  user: StaffProfile;
  notify: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"info" | "password">("info");

  const [name, setName] = useState(user.fullName ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");

  const displayName = user.fullName?.trim() || user.email || "Nhân viên";

  async function handleSave() {
    if (!name.trim()) {
      notify("Vui lòng nhập họ và tên.");
      return;
    }

    const payload: Record<string, string> = {};

    if (name.trim() !== (user.fullName ?? "")) {
      payload.full_name = name.trim();
    }

    if (email.trim() !== (user.email ?? "")) {
      payload.email = email.trim();
    }

    if (phone.trim() !== (user.phone ?? "")) {
      payload.phone = phone.trim();
    }

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    /*
     * TODO: Gọi API cập nhật hồ sơ staff tại đây.
     * Chỉ triển khai sau khi xác định đúng endpoint và DTO của backend.
     */

    setSaving(true);
    try {
      notify(
        "Chưa cấu hình API cập nhật hồ sơ nhân viên. Vui lòng tích hợp endpoint trước khi lưu.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="staff-profile-layout">
      <aside className="staff-profile-card staff-profile-sidebar">
        <div className="staff-profile-identity">
          <Avatar
            className="staff-profile-avatar"
            name={displayName}
            src={user.avatarUrl ?? undefined}
          />

          <h2>{displayName}</h2>
          <p>{user.email}</p>

          <span className="staff-profile-badge">
            <BadgeCheck size={15} />
            Tài khoản nhân viên
          </span>
        </div>

        <nav className="staff-profile-nav" aria-label="Cài đặt tài khoản">
          <button
            type="button"
            className={tab === "info" ? "active" : ""}
            onClick={() => setTab("info")}
          >
            <UserRound size={18} />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            className={tab === "password" ? "active" : ""}
            onClick={() => setTab("password")}
          >
            <LockKeyhole size={18} />
            <span>Đổi mật khẩu</span>
          </button>
        </nav>
      </aside>

      {tab === "info" ? (
        <section className="staff-profile-card staff-profile-form-card">
          <div className="staff-profile-section-heading">
            <div>
              <h2>Thông tin cơ bản</h2>
              <p>Cập nhật thông tin liên hệ của bạn.</p>
            </div>

            <button
              type="button"
              className="staff-profile-button"
              disabled={saving}
              onClick={() => {
                if (editing) {
                  void handleSave();
                } else {
                  setEditing(true);
                }
              }}
            >
              {editing ? <Check size={16} /> : <Pencil size={16} />}
              {editing ? "Lưu thay đổi" : "Chỉnh sửa"}
            </button>
          </div>

          <div className="staff-profile-fields">
            <label>
              Họ và tên
              <input
                value={name}
                disabled={!editing || saving}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </label>

            <label>
              Địa chỉ email
              <input
                type="email"
                value={email}
                disabled={!editing || saving}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </label>

            <label>
              Số điện thoại
              <input
                type="tel"
                value={phone ?? ""}
                disabled={!editing || saving}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </label>
          </div>

          {editing && (
            <div className="staff-profile-form-actions">
              <button
                type="button"
                className="staff-profile-button staff-profile-button--secondary"
                disabled={saving}
                onClick={() => {
                  setName(user.fullName ?? "");
                  setEmail(user.email ?? "");
                  setPhone(user.phone ?? "");
                  setEditing(false);
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                className="staff-profile-button"
                disabled={saving}
                onClick={() => {
                  void handleSave();
                }}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}

          <div className="staff-profile-security">
            <ShieldCheck size={22} />
            <div>
              <strong>Bảo mật tài khoản</strong>
              <p>
                Không chia sẻ mật khẩu hoặc thông tin đăng nhập của bạn
                với người khác.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <ChangeStaffPassword notify={notify} />
      )}
    </div>
  );
}

function ChangeStaffPassword({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [values, setValues] = useState<Record<PasswordField, string>>({
    current: "",
    next: "",
    confirm: "",
  });

  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passedRules = PASSWORD_RULES.filter((rule) =>
    rule.test(values.next),
  ).length;

  const strength = !values.next
    ? 0
    : passedRules <= 2
      ? 1
      : passedRules === 3
        ? 2
        : 3;

  const strengthLabel = ["", "Yếu", "Trung bình", "Mạnh"][strength];

  function setValue(field: PasswordField, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setError("");
  }

  function renderPasswordField(
    field: PasswordField,
    label: string,
    autoComplete: string,
  ) {
    return (
      <label className="staff-profile-password-label">
        {label}

        <span className="staff-profile-password-input">
          <LockKeyhole size={16} />

          <input
            type={visible[field] ? "text" : "password"}
            autoComplete={autoComplete}
            value={values[field]}
            onChange={(event) => setValue(field, event.target.value)}
            maxLength={72}
          />

          <button
            type="button"
            aria-label={visible[field] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={() =>
              setVisible((previous) => ({
                ...previous,
                [field]: !previous[field],
              }))
            }
          >
            {visible[field] ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
      </label>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.current) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (passedRules !== PASSWORD_RULES.length) {
      setError("Mật khẩu mới chưa đáp ứng đủ các yêu cầu.");
      return;
    }

    if (values.current === values.next) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    if (values.next !== values.confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    /*
     * TODO:
     * Gọi API đổi mật khẩu hiện có của backend.
     * Không tự giả định URL hoặc tên method của API.
     */

    setSubmitting(true);

    try {
      notify(
        "Chưa cấu hình API đổi mật khẩu nhân viên. Vui lòng tích hợp endpoint trước khi sử dụng.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="staff-profile-card staff-profile-form-card"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="staff-profile-section-heading">
        <div>
          <h2>Đổi mật khẩu</h2>
          <p>Đặt mật khẩu mạnh để bảo vệ tài khoản.</p>
        </div>
      </div>

      <div className="staff-profile-password-layout">
        <div className="staff-profile-password-fields">
          {renderPasswordField(
            "current",
            "Mật khẩu hiện tại",
            "current-password",
          )}

          {renderPasswordField("next", "Mật khẩu mới", "new-password")}

          {renderPasswordField(
            "confirm",
            "Xác nhận mật khẩu mới",
            "new-password",
          )}

          {error && (
            <p className="staff-profile-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="staff-profile-button"
            disabled={submitting}
          >
            {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </div>

        <aside className="staff-profile-password-aside">
          <strong>Yêu cầu mật khẩu</strong>

          <div
            className="staff-profile-strength-bar"
            aria-label={`Độ mạnh: ${strengthLabel || "Chưa xác định"}`}
          >
            <span className={`level-${strength}`} />
          </div>

          <small>
            {strength ? `Độ mạnh: ${strengthLabel}` : "Nhập mật khẩu mới"}
          </small>

          <ul>
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(values.next);

              return (
                <li key={rule.id} className={passed ? "passed" : ""}>
                  {passed ? "✓" : "○"} {rule.label}
                </li>
              );
            })}
          </ul>

          <p className="staff-profile-password-tip">
            Không sử dụng lại mật khẩu từ các dịch vụ khác.
          </p>
        </aside>
      </div>
    </form>
  );
}
