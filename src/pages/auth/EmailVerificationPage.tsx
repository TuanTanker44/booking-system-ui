import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthService } from "../../services/auth.js";
import "./EmailVerificationPage.css";
import type { ResendVerificationDto } from "../../types/auth.js";

type VerificationState = "idle" | "sending" | "success" | "error";

interface LocationState {
  email?: string;
}

export function EmailVerificationPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState(state?.email ?? "");
  const [status, setStatus] = useState<VerificationState>("idle");
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!email.trim() || countdown > 0 || status === "sending") {
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const dto: ResendVerificationDto = { email: email.trim() }
      await AuthService.resendVerification(dto);

      setStatus("success");
      setMessage(
        "Email xác minh đã được gửi. Vui lòng kiểm tra hộp thư của bạn.",
      );
      setCountdown(60);
    } catch {
      setStatus("error");
      setMessage(
        "Không thể gửi email xác minh lúc này. Vui lòng thử lại sau.",
      );
    }
  };

  return (
    <main className="verification-page">
      <div className="verification-background">
        <span className="verification-orb verification-orb--one" />
        <span className="verification-orb verification-orb--two" />
      </div>

      <section className="verification-card">
        <Link to="/home" className="verification-brand">
          <div className="verification-brand__icon">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="7"
                y="5"
                width="34"
                height="38"
                rx="8"
                fill="currentColor"
              />
              <circle
                cx="24"
                cy="25"
                r="11"
                stroke="white"
                strokeWidth="2.5"
              />
              <circle cx="24" cy="25" r="6" fill="#BFE7FF" />
              <circle cx="14" cy="12" r="1.5" fill="white" />
              <circle cx="19" cy="12" r="1.5" fill="white" />
            </svg>
          </div>

          <span>LaundryBooking</span>
        </Link>

        <div className="verification-illustration">
          <div className="verification-illustration__circle">
            <svg
              viewBox="0 0 120 120"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="19"
                y="31"
                width="82"
                height="59"
                rx="9"
                fill="#DBEEFF"
                stroke="#2563EB"
                strokeWidth="2.5"
              />
              <path
                d="M20 40L60 67L100 40"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 83L45 61M100 83L75 61"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="91" cy="27" r="15" fill="#2563EB" />
              <path
                d="M84 27L89 32L98 22"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M26 20L29 25L34 28L29 31L26 36L23 31L18 28L23 25L26 20Z"
                fill="#93C5FD"
              />
              <circle cx="103" cy="61" r="3" fill="#60A5FA" />
              <circle cx="14" cy="54" r="3" fill="#60A5FA" />
            </svg>
          </div>
        </div>

        <div className="verification-heading">
          <span className="verification-eyebrow">
            CHỈ CÒN MỘT BƯỚC NỮA
          </span>

          <h1>Xác minh email của bạn</h1>

          <p>
            Cảm ơn bạn đã đăng ký LaundryBooking! Chúng tôi đã gửi
            hướng dẫn xác minh tài khoản đến email của bạn.
          </p>
        </div>

        <div className="verification-email-box">
          <div className="verification-email-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M4 7L12 13L20 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="verification-email-content">
            <span>Email xác minh được gửi đến</span>

            {email ? (
              <strong>{email}</strong>
            ) : (
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Nhập địa chỉ email của bạn"
                aria-label="Địa chỉ email"
              />
            )}
          </div>
        </div>

        <div className="verification-instructions">
          <div className="verification-instructions__step">
            <span>1</span>
            <p>Mở hộp thư đến của bạn.</p>
          </div>

          <div className="verification-instructions__step">
            <span>2</span>
            <p>Tìm email xác minh từ LaundryBooking.</p>
          </div>

          <div className="verification-instructions__step">
            <span>3</span>
            <p>Nhấn vào liên kết trong email để kích hoạt tài khoản.</p>
          </div>
        </div>

        {message && (
          <div
            className={`verification-message verification-message--${status}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        <button
          type="button"
          className="verification-resend-button"
          onClick={handleResend}
          disabled={
            !email.trim() ||
            status === "sending" ||
            countdown > 0
          }
        >
          {status === "sending"
            ? "Đang gửi email..."
            : countdown > 0
              ? `Gửi lại email sau ${countdown}s`
              : "Gửi lại email xác minh"}
        </button>

        <div className="verification-help">
          <p>Chưa nhận được email?</p>
          <span>
            Hãy kiểm tra thư mục Spam hoặc Thư rác trước khi gửi
            lại.
          </span>
        </div>

        <div className="verification-divider" />

        <Link to="/login" className="verification-login-link">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M19 12H5M12 19L5 12L12 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Quay lại đăng nhập
        </Link>
      </section>

      <footer className="verification-footer">
        <span>© {new Date().getFullYear()} LaundryBooking</span>
        <span>Chăm sóc quần áo, chăm sóc bạn.</span>
      </footer>
    </main>
  );
}