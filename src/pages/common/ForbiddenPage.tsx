import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, House, LockKeyhole } from "lucide-react";
import "./ForbiddenPage.css";

export function ForbiddenPage() {
  return (
    <main className="forbidden-page">
      <div className="forbidden-background forbidden-background-1" />
      <div className="forbidden-background forbidden-background-2" />

      <section className="forbidden-content">
        <Link to="/" className="forbidden-brand">
          <span className="forbidden-brand-icon">
            <House size={22} strokeWidth={2.2} />
          </span>
          <span>Laundry Booking</span>
        </Link>

        <div className="forbidden-card">
          <div className="forbidden-icon-wrapper">
            <div className="forbidden-icon-circle">
              <ShieldAlert size={46} strokeWidth={1.6} />
            </div>
            <span className="forbidden-lock-badge">
              <LockKeyhole size={18} />
            </span>
          </div>

          <p className="forbidden-eyebrow">ACCESS DENIED</p>

          <h1 className="forbidden-code">403</h1>

          <h2 className="forbidden-title">
            Rất tiếc, bạn không có quyền truy cập!
          </h2>

          <p className="forbidden-description">
            Trang bạn đang cố truy cập bị giới hạn quyền truy cập.
            Vui lòng kiểm tra tài khoản hoặc quay lại trang chủ để
            tiếp tục sử dụng dịch vụ.
          </p>

          <div className="forbidden-notice">
            <ShieldAlert size={18} />
            <span>
              Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ với
              quản trị viên để được hỗ trợ.
            </span>
          </div>

          <div className="forbidden-actions">
            <Link to="/" className="forbidden-home-button">
              <House size={18} />
              Về trang chủ
            </Link>

            <button
              type="button"
              className="forbidden-back-button"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={18} />
              Quay lại
            </button>
          </div>

          <div className="forbidden-footer">
            <span className="forbidden-status-dot" />
            <span>403 Forbidden · Quyền truy cập bị từ chối</span>
          </div>
        </div>

        <p className="forbidden-bottom-text">
          Laundry Booking <span>·</span> Chăm sóc quần áo của bạn
        </p>
      </section>
    </main>
  );
}
