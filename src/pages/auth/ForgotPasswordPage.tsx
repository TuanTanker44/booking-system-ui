import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck, WashingMachine } from "lucide-react";
import { AuthService } from "../../services/auth";
import { getErrorMessage } from "../../lib/error.js";
import "./ForgotPasswordPage.css";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await AuthService.forgotPassword({ email: email.trim() });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="forgot-page">
      <div className="forgot-decoration forgot-decoration-one" />
      <div className="forgot-decoration forgot-decoration-two" />

      <Link to="/login" className="forgot-back-link"><ArrowLeft size={17} /> Quay lại đăng nhập</Link>

      <section className="forgot-card">
        <Link to="/login" className="forgot-brand">
          <span className="forgot-brand-icon"><WashingMachine size={25} /></span>
          <span>Laundry<span>Booking</span></span>
        </Link>

        {!submitted ? (
          <>
            <div className="forgot-illustration">
              <div className="forgot-illustration-circle"><Mail size={43} strokeWidth={1.6} /></div>
              <span className="forgot-shield"><ShieldCheck size={21} /></span>
            </div>

            <div className="forgot-heading">
              <span className="forgot-eyebrow">KHÔI PHỤC TÀI KHOẢN</span>
              <h1>Quên mật khẩu?</h1>
              <p>Đừng lo, chuyện này có thể xảy ra. Nhập email đã đăng ký, chúng tôi sẽ hướng dẫn bạn đặt lại mật khẩu.</p>
            </div>

            <form className="forgot-form" onSubmit={handleSubmit}>
              <label htmlFor="forgot-email">Địa chỉ email</label>
              <div className="forgot-input-wrap">
                <Mail size={18} />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {error && <p className="forgot-error" role="alert">{error}</p>}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi yêu cầu..." : "Gửi hướng dẫn đặt lại mật khẩu"}
              </button>
            </form>

            <div className="forgot-security-note"><ShieldCheck size={16} /> Vì lý do bảo mật, hãy chỉ sử dụng email bạn sở hữu.</div>
          </>
        ) : (
          <div className="forgot-success" role="status" aria-live="polite">
            <span className="forgot-success-icon"><CheckCircle2 size={38} /></span>
            <span className="forgot-eyebrow">YÊU CẦU ĐÃ ĐƯỢC GHI NHẬN</span>
            <h1>Kiểm tra hộp thư nhé!</h1>
            <p>Nếu địa chỉ <strong>{email.trim()}</strong> được liên kết với tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu. Hãy kiểm tra cả thư mục Spam/Thư rác.</p>
            <button type="button" onClick={() => { setSubmitted(false); setError(""); }}>Thử email khác</button>
          </div>
        )}

        <div className="forgot-divider" />
        <p className="forgot-bottom-link">Nhớ ra mật khẩu rồi? <Link to="/login">Đăng nhập</Link></p>
      </section>

      <footer className="forgot-footer">© {new Date().getFullYear()} LaundryBooking <span>·</span> Chăm sóc quần áo, chăm sóc cuộc sống.</footer>
    </main>
  );
}
