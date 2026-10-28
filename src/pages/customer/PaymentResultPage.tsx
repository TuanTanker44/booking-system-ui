import { useSearchParams, Link } from "react-router-dom";
import "./style.css";

type PaymentStatus = "success" | "failed" | "pending";

export function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  // VNPay trả về vnp_ResponseCode=00 khi giao dịch thành công.
  // MoMo có thể sử dụng resultCode=0.
  const isVnpay = searchParams.has("vnp_ResponseCode");
  const isMomo = searchParams.has("resultCode");

  const responseCode = isVnpay
    ? searchParams.get("vnp_ResponseCode")
    : searchParams.get("resultCode");

  const transactionId =
    searchParams.get("vnp_TxnRef") ??
    searchParams.get("orderId") ??
    searchParams.get("order_id");

  const paymentMethod = isVnpay
    ? "VNPay"
    : isMomo
      ? "MoMo"
      : "Thanh toán trực tuyến";

  // Chỉ hiển thị trạng thái đang xác minh.
  // Không coi query parameters là bằng chứng thanh toán đáng tin cậy.
  const [status] = [
    responseCode === null
      ? "pending"
      : responseCode === "00" || responseCode === "0"
        ? "pending"
        : "failed",
  ] as [PaymentStatus];

  const statusContent = {
    success: {
      icon: "✓",
      title: "Thanh toán thành công!",
      description: "Giao dịch của bạn đã được xác nhận.",
      label: "Đã thanh toán",
    },
    failed: {
      icon: "×",
      title: "Thanh toán chưa thành công",
      description:
        "Giao dịch không hoàn tất. Bạn có thể kiểm tra lại đơn hàng hoặc thử thanh toán lần nữa.",
      label: "Thất bại",
    },
    pending: {
      icon: "…",
      title: "Đang xác minh thanh toán",
      description:
        "Chúng tôi đang kiểm tra kết quả giao dịch. Vui lòng kiểm tra trạng thái đơn hàng trước khi thanh toán lại.",
      label: "Đang xác minh",
    },
  } satisfies Record<
    PaymentStatus,
    {
      icon: string;
      title: string;
      description: string;
      label: string;
    }
  >;

  const content = statusContent[status];

  return (
    <main className="payment-result">
      <header className="payment-header">
        <Link to="/" className="payment-brand">
          <span className="payment-brand-icon">✦</span>
          <span>Laundry Booking System</span>
        </Link>

        <nav className="payment-nav">
          <Link to="/">Trang chủ</Link>
          <Link to="/bookings">Đơn hàng của tôi</Link>
        </nav>
      </header>

      <section className="payment-card">
        <div className={`payment-status-icon ${status}`}>
          {content.icon}
        </div>

        <h1>{content.title}</h1>
        <p className="payment-description">{content.description}</p>

        <div className="payment-details">
          <div className="payment-detail-row">
            <span>Mã giao dịch</span>
            <strong>{transactionId || "Đang cập nhật"}</strong>
          </div>

          <div className="payment-detail-row">
            <span>Phương thức</span>
            <strong>{paymentMethod}</strong>
          </div>

          <div className="payment-detail-row">
            <span>Trạng thái</span>
            <span className={`payment-badge ${status}`}>
              {content.label}
            </span>
          </div>
        </div>

        <div className="payment-actions">
          <Link to="/" className="payment-button primary">
            Về trang chủ
          </Link>

          <Link to="/bookings" className="payment-button secondary">
            Xem đơn hàng của tôi
          </Link>
        </div>

        <div className="payment-support">
          Cần hỗ trợ? Vui lòng liên hệ bộ phận chăm sóc khách hàng.
        </div>
      </section>
    </main>
  );
}