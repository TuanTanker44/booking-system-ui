import { useEffect, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { getCurrentCoordinates, reverseGeocode } from "../../lib/location";
import "./LocationPermissionDialog.css";

const DISMISSED_KEY = "locationPromptDismissed";

interface Props {
  onAddressDetected: (address: string) => void;
  notify: (message: string) => void;
}

export function LocationPermissionDialog({
  onAddressDetected,
  notify,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");

  async function detectAddress() {
    const coordinates = await getCurrentCoordinates();
    const address = await reverseGeocode(coordinates);

    onAddressDetected(address);
  }

  // Khi vào dashboard: hỏi người dùng nếu chưa cấp/từ chối quyền vị trí.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (sessionStorage.getItem(DISMISSED_KEY)) return;

      let state: PermissionState = "prompt";

      try {
        const status = await navigator.permissions.query({
          name: "geolocation",
        });
        state = status.state;
      } catch {
        // Trình duyệt không hỗ trợ Permissions API: vẫn hiện hộp thoại
      }

      if (cancelled || state === "denied") return;

      if (state === "granted") {
        // Đã cấp quyền từ trước: lấy vị trí luôn, không cần hỏi lại
        try {
          await detectAddress();
        } catch {
          // Bỏ qua, người dùng vẫn nhập địa chỉ thủ công được
        }
        return;
      }

      setOpen(true);
    }

    void init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  }

  async function handleAllow() {
    setError("");
    setIsLocating(true);

    try {
      await detectAddress();
      sessionStorage.setItem(DISMISSED_KEY, "1");
      setOpen(false);
      notify("Đã lấy vị trí hiện tại. Hãy kiểm tra địa chỉ trước khi lưu.");
    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError) {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Bạn đã từ chối quyền truy cập vị trí. Có thể bật lại trong cài đặt trình duyệt."
            : "Không thể xác định vị trí của bạn. Vui lòng thử lại.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể xác định vị trí của bạn.",
        );
      }
    } finally {
      setIsLocating(false);
    }
  }

  if (!open) return null;

  return (
    <div className="location-dialog-backdrop">
      <div
        className="location-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-dialog-title"
      >
        <span className="location-dialog-icon">
          <MapPin />
        </span>

        <h2 id="location-dialog-title">
          Cho phép truy cập vị trí của bạn?
        </h2>
        <p>
          Chúng tôi dùng vị trí hiện tại để tự động điền địa chỉ lấy
          và giao đồ giặt. Bạn có thể kiểm tra và chỉnh sửa địa chỉ
          trước khi lưu.
        </p>

        {error && (
          <p className="location-dialog-error" role="alert">
            {error}
          </p>
        )}

        <div className="location-dialog-actions">
          <button
            type="button"
            className="outline-button"
            onClick={dismiss}
            disabled={isLocating}
          >
            {error ? "Đóng" : "Để sau"}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleAllow}
            disabled={isLocating}
          >
            <LocateFixed />
            {isLocating
              ? "Đang xác định vị trí..."
              : error
                ? "Thử lại"
                : "Cho phép"}
          </button>
        </div>
      </div>
    </div>
  );
}
