import axiosInstance from "../lib/axios";

import type {
  Booking,
  BookingDetail,
  BookingQuote,
  BookingStatus,
  CancelBookingResult,
  CreateBookingInput,
  ManageBookingsParams,
  MyBookingsParams,
  PaginatedBookings,
  UpdateBookingStatusInput,
} from "../types/booking";

export const BookingService = {
  // POST /bookings/quote (customer)
  async quote(input: CreateBookingInput): Promise<BookingQuote> {
    const { data } = await axiosInstance.post<{ data: BookingQuote }>(
      "/bookings/quote",
      input,
    );
    return data.data;
  },

  // POST /bookings (customer). Đơn mới ở trạng thái pending_payment.
  async create(input: CreateBookingInput): Promise<Booking> {
    const { data } = await axiosInstance.post<{ data: Booking }>(
      "/bookings",
      input,
    );
    return data.data;
  },

  // GET /bookings?status=&page=&limit= (customer): đơn của tôi
  async listMine(
    params: MyBookingsParams = {},
    signal?: AbortSignal,
  ): Promise<PaginatedBookings> {
    const { data } = await axiosInstance.get<PaginatedBookings>("/bookings", {
      params,
      signal,
    });
    return data;
  },

  // GET /bookings/manage?store_id=&date=&status= (admin: mọi đơn; staff: cửa hàng được gán)
  async listManageable(
    params: ManageBookingsParams = {},
    signal?: AbortSignal,
  ): Promise<PaginatedBookings> {
    const { data } = await axiosInstance.get<PaginatedBookings>(
      "/bookings/manage",
      { params, signal },
    );
    return data;
  },

  // GET /bookings/:id (chủ đơn, staff của cửa hàng, admin)
  async getById(id: number, signal?: AbortSignal): Promise<BookingDetail> {
    const { data } = await axiosInstance.get<{ data: BookingDetail }>(
      `/bookings/${id}`,
      { signal },
    );
    return data.data;
  },

  // POST /bookings/:id/cancel (chủ đơn, staff của cửa hàng, admin). Chỉ hủy được pending_payment / confirmed.
  async cancel(id: number, reason?: string): Promise<CancelBookingResult> {
    const { data } = await axiosInstance.post<{ data: CancelBookingResult }>(
      `/bookings/${id}/cancel`,
      reason ? { reason } : {},
    );
    return data.data;
  },

  // PATCH /bookings/:id/status (admin / staff của cửa hàng)
  async changeStatus(
    id: number,
    input: UpdateBookingStatusInput,
  ): Promise<Booking> {
    const { data } = await axiosInstance.patch<{ data: Booking }>(
      `/bookings/${id}/status`,
      input,
    );
    return data.data;
  },
};

// Các trạng thái khách còn được hủy đơn
export const CANCELLABLE_STATUSES: BookingStatus[] = [
  "pending_payment",
  "confirmed",
];

// Đơn đang diễn ra (chưa hoàn thành / hủy)
export const ACTIVE_STATUSES: BookingStatus[] = [
  "pending_payment",
  "confirmed",
  "picked_up",
  "processing",
  "ready_for_delivery",
  "delivering",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: "Chờ thanh toán",
  confirmed: "Đã xác nhận",
  picked_up: "Đã lấy đồ",
  processing: "Đang giặt",
  ready_for_delivery: "Sẵn sàng giao",
  delivering: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Không đến",
};
