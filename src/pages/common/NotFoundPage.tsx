import { Link } from "react-router-dom";
import { ArrowLeft, House, SearchX, WashingMachine } from "lucide-react";
import "./NotFoundPage.css";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-background not-found-background-1" />
      <div className="not-found-background not-found-background-2" />

      <section className="not-found-content">
        {/* Logo */}
        <Link to="/" className="not-found-brand">
          <span className="not-found-brand-icon">
            <WashingMachine size={23} strokeWidth={2.2} />
          </span>
          <span>Laundry Booking</span>
        </Link>

        {/* Main card */}
        <div className="not-found-card">
          <div className="not-found-illustration">
            <div className="not-found-circle not-found-circle-outer" />
            <div className="not-found-circle not-found-circle-inner" />

            <div className="not-found-search-icon">
              <SearchX size={54} strokeWidth={1.5} />
            </div>

            <span className="not-found-floating floating-dot">?</span>
            <span className="not-found-floating floating-star">✦</span>
            <span className="not-found-floating floating-sparkle">✧</span>
          </div>

          <p className="not-found-eyebrow">OOPS! PAGE NOT FOUND</p>

          <h1 className="not-found-code">404</h1>

          <h2 className="not-found-title">
            Hình như bạn đi lạc rồi!
          </h2>

          <p className="not-found-description">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được
            di chuyển đến một địa chỉ khác. Đừng lo, hãy quay
            lại để tiếp tục hành trình của bạn nhé!
          </p>

          <div className="not-found-actions">
            <Link to="/" className="not-found-home-button">
              <House size={18} />
              Về trang chủ
            </Link>

            <button
              type="button"
              className="not-found-back-button"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={18} />
              Quay lại
            </button>
          </div>

          <div className="not-found-divider" />

          <p className="not-found-help">
            <span className="not-found-help-dot" />
            <span>
              Laundry Booking luôn sẵn sàng phục vụ bạn.
            </span>
          </p>
        </div>

        <p className="not-found-footer">
          © {new Date().getFullYear()} Laundry Booking
          <span>·</span>
          Chăm sóc quần áo của bạn
        </p>
      </section>
    </main>
  );
}