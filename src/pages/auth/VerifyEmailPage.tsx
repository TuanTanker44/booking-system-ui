import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../../lib/error.js";
import { AuthService } from "../../services/auth.js";
import "./EmailVerificationPage.css";

type VerifyState = "verifying" | "success" | "error";

const REDIRECT_SECONDS = 5;

// Trang đích của link trong email: /verify-email?token=...
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerifyState>(
    token ? "verifying" : "error",
  );
  const [message, setMessage] = useState(
    token ? "" : "Liên kết xác minh không hợp lệ.",
  );

  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  // StrictMode chạy effect 2 lần, token chỉ dùng được một lần
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    AuthService.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(
          getErrorMessage(
            err,
            "Liên kết xác minh không hợp lệ hoặc đã hết hạn.",
          ),
        );
      });
  }, [token]);

  // Sau khi xác minh thành công: đếm ngược rồi chuyển sang đăng nhập
  useEffect(() => {
    if (status !== "success") return;

    if (countdown <= 0) {
      navigate("/login", { replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [status, countdown, navigate]);

  return (
    <main className="verification-page">
      <div className="verification-background">
        <span className="verification-orb verification-orb--one" />
        <span className="verification-orb verification-orb--two" />
      </div>

      <section className="verification-card">
        <div className="verification-heading">
          {status === "verifying" && (
            <>
              <h1>Đang xác minh email...</h1>
              <p>Vui lòng đợi trong giây lát.</p>
            </>
          )}

          {status === "success" && (
            <>
              <span className="verification-eyebrow">THÀNH CÔNG</span>
              <h1>Xác minh email thành công</h1>
              <p aria-live="polite">
                Bạn sẽ tự động được chuyển đến trang đăng nhập
                trong {countdown} giây.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <h1>Xác minh không thành công</h1>
              <div
                className="verification-message verification-message--error"
                role="alert"
              >
                {message}
              </div>
            </>
          )}
        </div>

        <div className="verification-divider" />

        <Link to="/login" className="verification-login-link">
          {status === "success" ? "Đăng nhập ngay" : "Đến trang đăng nhập"}
        </Link>
      </section>
    </main>
  );
}
