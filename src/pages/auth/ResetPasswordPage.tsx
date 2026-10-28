import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, WashingMachine } from "lucide-react";
import { AuthService } from "../../services/auth";
import { getErrorMessage } from "../../lib/error.js";
import "./ResetPasswordPage.css";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.resetPassword({ token, password });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn; hãy yêu cầu liên kết mới."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="reset-page">
      <div className="reset-decoration reset-decoration-one" />
      <div className="reset-decoration reset-decoration-two" />
      <Link to="/login" className="reset-back-link"><ArrowLeft size={17} /> Quay lại đăng nhập</Link>

      <section className="reset-card">
        <Link to="/login" className="reset-brand">
          <span className="reset-brand-icon"><WashingMachine size={25} /></span>
          <span>Laundry<span>Booking</span></span>
        </Link>

        {!submitted ? (
          <>
            <div className="reset-illustration">
              <div className="reset-illustration-circle"><LockKeyhole size={39} strokeWidth={1.7} /></div>
              <span className="reset-shield"><ShieldCheck size={20} /></span>
            </div>
            <div className="reset-heading">
              <span className="reset-eyebrow">BẢO MẬT TÀI KHOẢN</span>
              <h1>Tạo mật khẩu mới</h1>
              <p>Hãy chọn một mật khẩu mạnh mà bạn chưa sử dụng cho tài khoản này trước đây.</p>
            </div>

            {!token && (
              <div className="reset-error" role="alert">
                Liên kết thiếu token đặt lại mật khẩu. Vui lòng mở đầy đủ liên kết trong email hoặc yêu cầu liên kết mới.
              </div>
            )}

            <form className="reset-form" onSubmit={handleSubmit}>
              <label htmlFor="reset-password">Mật khẩu mới</label>
              <div className="reset-input-wrap">
                <LockKeyhole size={17} />
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  disabled={!token}
                />
                <button className="reset-visibility" type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <label htmlFor="reset-confirm-password">Xác nhận mật khẩu mới</label>
              <div className="reset-input-wrap">
                <LockKeyhole size={17} />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  disabled={!token}
                />
                <button className="reset-visibility" type="button" aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"} onClick={() => setShowConfirmPassword((value) => !value)}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <p className="reset-password-hint">Nên dùng ít nhất 8 ký tự, kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
              {error && <p className="reset-error" role="alert">{error}</p>}
              <button className="reset-submit" type="submit" disabled={isSubmitting || !token}>
                {isSubmitting ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          </>
        ) : (
          <div className="reset-success" role="status" aria-live="polite">
            <span className="reset-success-icon"><CheckCircle2 size={39} /></span>
            <span className="reset-eyebrow">CẬP NHẬT THÀNH CÔNG</span>
            <h1>Mật khẩu đã được đổi</h1>
            <p>Bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản LaundryBooking.</p>
            <Link className="reset-submit reset-login-button" to="/login">Quay lại đăng nhập</Link>
          </div>
        )}

        {!submitted && (
          <>
            <div className="reset-divider" />
            <p className="reset-bottom-link">Chưa nhận được liên kết? <Link to="/forgot-password">Yêu cầu lại</Link></p>
          </>
        )}
      </section>
      <footer className="reset-footer">© {new Date().getFullYear()} LaundryBooking <span>·</span> Chăm sóc quần áo, chăm sóc cuộc sống.</footer>
    </main>
  );
}
