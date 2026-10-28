import axiosInstance from "../lib/axios";
import type {
  ApiResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  Payment,
  PaymentListResponse,
} from "../types/payment";

export const PaymentService = {
  /**
   * POST /api/payments
   * Tạo giao dịch cho booking của khách hàng đang đăng nhập.
   */
  async create(
    payload: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    const response = await axiosInstance.post<ApiResponse<CreatePaymentResponse>>(
      "/payments",
      payload,
    );

    return response.data.data;
  },

  /**
   * GET /api/payments?booking_id={bookingId}
   * Lấy lịch sử thanh toán của một booking.
   */
  async listByBooking(bookingId: number): Promise<Payment[]> {
    const response = await axiosInstance.get<PaymentListResponse>("/payments", {
      params: {
        booking_id: bookingId,
      },
    });

    return response.data.data;
  },
};