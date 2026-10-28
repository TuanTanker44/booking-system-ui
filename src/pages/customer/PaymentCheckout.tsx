import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, LoaderCircle, QrCode, XCircle } from "lucide-react";
import { PaymentService } from "../../services/payment";
import type { CreatePaymentResponse, PaymentStatus } from "../../types/payment";
import { formatMoney } from "./format";
import "./style.css";

interface PaymentCheckoutProps {
  payment: CreatePaymentResponse;
  bookingId: number;
  bookingCode: string;
  // Quay lại bước chọn phương thức thanh toán
  onBack: () => void;
  // Gọi khi backend xác nhận giao dịch đã thanh toán thành công
  onPaid: () => void;
  // Đóng hẳn màn thanh toán (sau khi đã thanh toán xong)
  onClose: () => void;
}

// Chu kỳ hỏi backend xem khách đã quét QR và thanh toán xong chưa
const POLL_INTERVAL_MS = 4000;

const METHOD_LABELS = { vnpay: "VNPay", momo: "MoMo" } as const;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function PaymentCheckout({
  payment,
  bookingId,
  bookingCode,
  onBack,
  onPaid,
  onClose,
}: PaymentCheckoutProps) {
  const [opening, setOpening] = useState(false);
  // Giữ callback mới nhất mà không làm vòng polling bị tạo lại mỗi lần cha render
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  });
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  // Trạng thái giao dịch do backend xác nhận (không tin query parameters phía client)
  const [status, setStatus] = useState<PaymentStatus>("pending");

  const methodLabel = METHOD_LABELS[payment.method];
  const expiresAt = new Date(payment.expires_at).getTime();
  const remaining = currentTime === null ? null : expiresAt - currentTime;
  const expired = remaining !== null && remaining <= 0;
  const settled = status !== "pending";
  const qrActive = !expired && !settled;

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());

    updateCurrentTime();
    const intervalId = window.setInterval(updateCurrentTime, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Khách quét QR bằng app ngân hàng/ví nên trang này không biết khi nào xong: hỏi backend định kỳ
  useEffect(() => {
    if (expired || settled) return;

    let cancelled = false;

    const check = async () => {
      try {
        const payments = await PaymentService.listByBooking(bookingId);
        const current = payments.find((item) => item.id === payment.payment_id);

        if (cancelled || !current || current.status === "pending") return;

        setStatus(current.status);
        if (current.status === "success") onPaidRef.current();
      } catch {
        // Lỗi mạng tạm thời: bỏ qua, lần kiểm tra sau sẽ thử lại
      }
    };

    const intervalId = window.setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [bookingId, payment.payment_id, expired, settled]);

  const openPayment = () => {
    if (!qrActive || !payment.payment_url) return;

    // Chỉ mở URL được backend trả về.
    // Không tự tạo URL thanh toán từ query parameters phía client.
    setOpening(true);
    window.location.assign(payment.payment_url);
  };

  return (
    <section className="checkout-card">
        <button className="checkout-back" onClick={status === "success" ? onClose : onBack}>
          <ArrowLeft size={17} />
          {status === "success" ? "Đóng" : "Chọn phương thức thanh toán khác"}
        </button>

        <div className="checkout-heading">
          <span className="checkout-eyebrow">THANH TOÁN ĐƠN HÀNG</span>
          <h1>{status === "success" ? "Thanh toán thành công" : "Hoàn tất thanh toán"}</h1>
          <p>
            Đơn hàng <strong>{bookingCode}</strong>{" "}
            {status === "success" ? "đã được thanh toán." : "đang chờ thanh toán."}
          </p>
        </div>

        <div className="checkout-amount">
          <span>Số tiền cần thanh toán</span>
          <strong>{formatMoney(payment.amount)}</strong>
          <span className="checkout-method">Phương thức: {methodLabel}</span>
        </div>

        {payment.qr_code_url && !qrFailed ? (
          <div className="checkout-qr">
            <div className={`checkout-qr-frame ${qrActive ? "" : "is-inactive"}`}>
              <img
                src={payment.qr_code_url}
                alt={`QR thanh toán ${methodLabel}`}
                onError={() => setQrFailed(true)}
              />
              {status === "success" && (
                <div className="checkout-qr-cover checkout-qr-paid">
                  <CheckCircle2 size={44} />
                  <span>Đã thanh toán</span>
                </div>
              )}
              {status === "failed" && (
                <div className="checkout-qr-cover checkout-qr-failed">
                  <XCircle size={44} />
                  <span>Giao dịch thất bại</span>
                </div>
              )}
              {expired && !settled && (
                <div className="checkout-qr-cover checkout-qr-expired">
                  <QrCode size={44} />
                  <span>Mã QR đã hết hạn</span>
                </div>
              )}
            </div>
            {qrActive && (
              <>
                <p>Mở ứng dụng {methodLabel} và quét mã QR để thanh toán.</p>
                <p className="checkout-waiting">
                  <LoaderCircle size={14} className="checkout-spinner" />
                  Đang chờ bạn thanh toán...
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="checkout-no-qr">
            <QrCode size={28} />
            <p>
              {qrFailed
                ? "Không tải được mã QR. Bạn vẫn có thể tiếp tục đến trang thanh toán."
                : "Cổng thanh toán chưa cung cấp mã QR riêng. Bạn có thể tiếp tục đến trang thanh toán."}
            </p>
          </div>
        )}

        <div className="checkout-expiry">
          {qrActive && remaining !== null ? (
            <>
              Mã còn hiệu lực: <strong>{formatCountdown(remaining)}</strong> · hết hạn lúc{" "}
              {new Date(payment.expires_at).toLocaleString("vi-VN")}
            </>
          ) : (
            <>Thời hạn thanh toán: {new Date(payment.expires_at).toLocaleString("vi-VN")}</>
          )}
        </div>

        {status === "success" ? (
          <button className="checkout-pay-button" onClick={onClose}>
            <CheckCircle2 size={18} />
            Xem đơn hàng
          </button>
        ) : (
          <button
            className="checkout-pay-button"
            onClick={openPayment}
            disabled={opening || !qrActive || !payment.payment_url}
          >
            {opening ? (
              <>
                <LoaderCircle size={18} className="checkout-spinner" />
                Đang chuyển đến cổng thanh toán...
              </>
            ) : (
              <>
                Thanh toán trên trang {methodLabel}
                <ExternalLink size={17} />
              </>
            )}
          </button>
        )}

        {status === "failed" && (
          <p className="checkout-warning">
            Giao dịch không thành công. Vui lòng quay lại và chọn phương thức thanh toán để thử lại.
          </p>
        )}

        {expired && !settled && (
          <p className="checkout-warning">
            Phiên thanh toán đã hết hạn. Vui lòng kiểm tra trạng thái đơn hàng
            trước khi tạo giao dịch mới.
          </p>
        )}

        <p className="checkout-note">
          Trạng thái đơn hàng sẽ được cập nhật sau khi hệ thống xác nhận
          kết quả giao dịch.
        </p>
    </section>
  );
}
