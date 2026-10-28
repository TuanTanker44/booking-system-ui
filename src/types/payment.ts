export type OnlinePaymentMethod = "vnpay" | "momo";

export type PaymentType = "full" | "deposit";

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed";

export interface Payment {
  id: number;
  booking_id?: number;
  payment_type: PaymentType;
  amount: number;
  method: OnlinePaymentMethod | "cash";
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  // Chỉ có khi giao dịch còn dùng được (đang chờ, chưa hết hạn): để mở lại QR / link thanh toán
  payment_url: string | null;
  qr_code_url: string | null;
  expires_at: string | null;
}

export interface CreatePaymentRequest {
  booking_id: number;
  method: OnlinePaymentMethod;
}

export interface CreatePaymentResponse {
  payment_id: number;
  method: OnlinePaymentMethod;
  amount: number;
  payment_url: string;
  qr_code_url: string | null;
  expires_at: string;
}

export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface PaymentListResponse {
  data: Payment[];
}
