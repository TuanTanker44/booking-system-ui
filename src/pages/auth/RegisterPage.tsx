import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../lib/error.js";
import {
  isPasswordValid,
  PASSWORD_RULES,
} from "../../lib/password.js";
import { useUserStore } from "../../stores/user.js";
import "./RegisterPage.css";

// YYYY-MM-DD theo giờ địa phương, dùng làm giới hạn tối đa của ô ngày sinh
function getToday(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = getToday();

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!dateOfBirth || dateOfBirth > today) {
      setError("Ngày sinh không hợp lệ.");
      return;
    }

    if (!isPasswordValid(password)) {
      setError("Mật khẩu chưa đáp ứng đủ các yêu cầu bên dưới.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Thay register bằng đúng tên action đăng ký trong Zustand store.
      const register = useUserStore.getState().register;

      await register({
        name: name.trim(),
        date_of_birth: dateOfBirth,
        email: email.trim(),
        password,
      });

      setSuccess(
        "Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.",
      );

      navigate("/verify-email", {
        replace: true,
        state: {
          email: email.trim(),
        },
      });
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Không thể đăng ký tài khoản. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page register-page">
      <div className="auth-decoration auth-decoration-1" />
      <div className="auth-decoration auth-decoration-2" />

      <section className="auth-card register-card">
        <div className="auth-logo">
          <img
            src="/logo.png"
            alt="LaundryBooking Logo"
            className="auth-logo-image"
          />
          <span>LaundryBooking</span>
        </div>

        <div className="auth-heading">
          <h1>Tạo tài khoản</h1>
          <p>
            Tham gia LaundryBooking để đặt lịch giặt
            <br />
            nhanh chóng và tiện lợi.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="name">Họ và tên</label>
            <input
              id="name"
              type="text"
              placeholder="Nhập họ và tên của bạn"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="date-of-birth">Ngày sinh</label>
            <input
              id="date-of-birth"
              type="date"
              className={dateOfBirth ? undefined : "date-empty"}
              autoComplete="bday"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              min="1900-01-01"
              max={today}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              placeholder="example@email.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="register-password">Mật khẩu</label>
            <input
              id="register-password"
              type="password"
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              maxLength={72}
              required
            />

            <ul className="password-checklist" aria-live="polite">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(password);

                return (
                  <li
                    key={rule.id}
                    className={
                      passed
                        ? "password-rule password-rule-passed"
                        : "password-rule"
                    }
                  >
                    <span aria-hidden="true">
                      {passed ? "✓" : "○"}
                    </span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirm-password">
              Xác nhận mật khẩu
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="register-success" role="status">
              {success}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Đang tạo tài khoản..."
              : "Đăng ký"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Đã có tài khoản?{" "}
            <Link to="/login">Đăng nhập</Link>
          </p>
        </div>

        <div className="auth-bottom-note">
          Chăm sóc quần áo, chăm sóc cuộc sống.
        </div>
      </section>
    </main>
  );
}