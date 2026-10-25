import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../../stores/user.js";

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

      // Lấy user mới nhất sau khi đăng nhập
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
    } catch {
      setError("Email hoặc mật khẩu không chính xác.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Đăng nhập</h1>
        <p>Đăng nhập để quản lý lịch đặt giặt của bạn.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </section>
    </main>
  );
}
