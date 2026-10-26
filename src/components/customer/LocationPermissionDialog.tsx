import { useEffect, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { getErrorMessage } from "../../lib/error";
import { getCurrentCoordinates, reverseGeocode } from "../../lib/location";
import "./LocationPermissionDialog.css";

// Lưu trong bộ nhớ (không dùng sessionStorage) để mỗi lần tải lại trang đều hỏi lại,
// nhưng chuyển trang trong ứng dụng rồi quay lại thì không hỏi lặp.
let promptHandled = false;
let cachedAddress = "";

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

    cachedAddress = address;
    onAddressDetected(address);
  }

  // Khi vào dashboard: hiện hộp thoại hỏi quyền vị trí (trừ khi đã bị chặn trong trình duyệt).
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Đã lấy địa chỉ trong lần tải trang này: dùng lại, không hỏi nữa
      if (cachedAddress) {
        onAddressDetected(cachedAddress);
        return;
      }

      if (promptHandled) return;

      let state: PermissionState = "prompt";

      try {
        const status = await navigator.permissions.query({
          name: "geolocation",
        });
        state = status.state;
      } catch {
        // Trình duyệt không hỗ trợ Permissions API: vẫn hiện hộp thoại
      }

      // Đã chặn vị trí trong trình duyệt thì hộp thoại không có tác dụng
      if (cancelled || state === "denied") return;

      setOpen(true);
    }

    void init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    promptHandled = true;
    setOpen(false);
  }

  async function handleAllow() {
    setError("");
    setIsLocating(true);

    try {
      await detectAddress();
      promptHandled = true;
      setOpen(false);
      notify("Đã lấy vị trí hiện tại. Hãy kiểm tra địa chỉ trước khi lưu.");
    } catch (err: unknown) {
      console.error("Không thể lấy địa chỉ từ vị trí hiện tại:", err);

      if (err instanceof GeolocationPositionError) {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Bạn đã từ chối quyền truy cập vị trí. Có thể bật lại trong cài đặt trình duyệt."
            : "Không thể xác định vị trí của bạn. Vui lòng thử lại.",
        );
      } else {
        setError(
          getErrorMessage(
            err,
            "Không thể xác định địa chỉ từ vị trí của bạn.",
          ),
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
