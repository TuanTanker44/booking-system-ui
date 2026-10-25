import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../../stores/user.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useUserStore((state) => state.register);
  const isLoading = useUserStore((state) => state.isLoading);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await register({ name, email, password });
      navigate("/", { replace: true });
    } catch {
      setError("Không thể đăng ký. Hãy kiểm tra lại thông tin.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Tạo tài khoản</h1>
        <p>Đăng ký để bắt đầu sử dụng dịch vụ giặt là.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Họ và tên</label>
          <input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <label htmlFor="confirm-password">
            Xác nhận mật khẩu
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <p>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </section>
    </main>
  );
}