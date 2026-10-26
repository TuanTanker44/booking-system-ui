import { isAxiosError } from "axios";

interface ErrorBody {
  message?: string | string[];
  error?: string;
  // Lỗi validation của backend: [{ property, constraints: { rule: message } }]
  errors?: { property?: string; constraints?: Record<string, string> }[];
}

// Lấy message do server trả về (hỗ trợ message dạng string hoặc mảng
// lỗi validation), nếu không có thì dùng fallback.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ErrorBody>(error)) {
    const details = error.response?.data?.errors
      ?.flatMap((item) => Object.values(item.constraints ?? {}))
      .filter(Boolean);

    if (details && details.length > 0) {
      return details.join("\n");
    }

    const message = error.response?.data?.message;

    if (Array.isArray(message) && message.length > 0) {
      return message.join("\n");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (!error.response) {
      return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
