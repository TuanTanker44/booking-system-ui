import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../lib/error.js";
import { useUserStore } from "../../stores/user.js";
import "./LoginPage.css";

export function LoginPage() {
  const navigate = useNavigate();

  const login = useUserStore((state) => state.login);
  const isLoading = useUserStore((state) => state.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    try {
      await login({ email, password });

      const currentUser = useUserStore.getState().user;

      if (!currentUser) {
        setError(
          "Đăng nhập thành công nhưng chưa lấy được thông tin người dùng.",
        );
        return;
      }

      switch (currentUser.role) {
        case "ADMIN":
          navigate("/admin", { replace: true });
          break;

        case "STAFF":
          navigate("/staff", { replace: true });
          break;

        case "CUSTOMER":
          navigate("/customer", { replace: true });
          break;

        default:
          navigate("/forbidden", { replace: true });
      }
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Email hoặc mật khẩu không chính xác."),
      );
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-1" />
      <div className="auth-decoration auth-decoration-2" />

      <section className="auth-card">
        <div className="auth-logo">
          <img className="auth-logo-icon" src="/logo.png" alt="" />
          <span>LaundryBooking</span>
        </div>

        <div className="auth-heading">
          <h1>Chào mừng trở lại!</h1>
          <p>
            Đăng nhập để quản lý lịch đặt giặt
            <br />
            và trải nghiệm dịch vụ của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="auth-forgot-password-row">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Chưa có tài khoản?{" "}
            <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>

        <div className="auth-bottom-note">
          Chăm sóc quần áo, chăm sóc cuộc sống.
        </div>
      </section>
    </main>
  );
}