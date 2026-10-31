import axiosInstance from "../lib/axios";
import { ACTIVE_STATUSES, BookingService } from "./booking";
import type { Booking, BookingStatus } from "../types/booking";
import type {
  PaginatedStaffBookings,
  StaffBookingDetail,
  StaffBookingsParams,
  StoreBookingCounts,
  StaffCustomer,
  StoreStaffBooking,
  AssignedDeliveryTrip,
} from "../types/staff-api";

export const staffService = {
  async assignShipper(bookingId: number, shipperId: number): Promise<AssignedDeliveryTrip> {
    const { data } = await axiosInstance.post<{ data: AssignedDeliveryTrip }>(
      `/bookings/${bookingId}/assign-shipper`, { shipper_id: shipperId },
    );
    return data.data;
  },

  // /manage lọc đúng cửa hàng; /staff bổ sung tên/SĐT khách để tìm kiếm toàn danh sách.
  // Ghép theo ID, không dùng danh sách /staff của mọi cửa hàng để tính thống kê.
  async getStoreBookingsWithCustomers(
    storeId: number,
    signal?: AbortSignal,
  ): Promise<StoreStaffBooking[]> {
    const bookings = await staffService.getStoreBookings(storeId, signal);
    const remaining = new Set(bookings.map((booking) => booking.id));
    const customers = new Map<number, StaffCustomer>();
    let page = 1;
    let totalPages = 1;
    while (remaining.size > 0 && page <= totalPages) {
      const result = await staffService.getBookings({ page, limit: 100 }, signal);
      for (const booking of result.data) {
        if (!remaining.has(booking.id)) continue;
        customers.set(booking.id, booking.users_bookings_customer_idTousers);
        remaining.delete(booking.id);
      }
      totalPages = result.pagination.totalPages;
      page += 1;
    }
    return bookings.map((booking) => ({
      ...booking,
      customer: customers.get(booking.id) ?? null,
    }));
  },

  // Lấy đủ các trang để tính thống kê từ toàn bộ đơn của cửa hàng.
  async getStoreBookings(storeId: number, signal?: AbortSignal): Promise<Booking[]> {
    const first = await BookingService.listManageable(
      { store_id: storeId, page: 1, limit: 100 }, signal,
    );
    const bookings = [...first.data];
    for (let page = 2; page <= first.meta.totalPages; page += 1) {
      const next = await BookingService.listManageable(
        { store_id: storeId, page, limit: 100 }, signal,
      );
      bookings.push(...next.data);
    }
    return bookings;
  },

  // GET /bookings/staff: mọi cửa hàng được phân công, KHÔNG hỗ trợ store_id/status/date.
  async getBookings(
    params: StaffBookingsParams = {},
    signal?: AbortSignal,
  ): Promise<PaginatedStaffBookings> {
    const { data } = await axiosInstance.get<PaginatedStaffBookings>(
      "/bookings/staff",
      { params, signal },
    );
    return data;
  },

  // Response là chi tiết trực tiếp, không bọc trong { data }.
  async getBookingDetail(id: number, signal?: AbortSignal): Promise<StaffBookingDetail> {
    const { data } = await axiosInstance.get<StaffBookingDetail>(
      `/bookings/staff/${id}`,
      { signal },
    );
    return data;
  },

  // Đếm theo trạng thái hiện tại trên toàn bộ đơn của cửa hàng, không chỉ một trang.
  // `date` nếu truyền vào là NGÀY LẤY ĐỒ, không phải ngày tạo/hoàn thành/hủy.
  async getStoreBookingCounts(
    storeId: number,
    date?: string,
    signal?: AbortSignal,
  ): Promise<StoreBookingCounts> {
    const statuses: BookingStatus[] = [
      ...ACTIVE_STATUSES, "completed", "cancelled", "no_show",
    ];
    const entries = await Promise.all(statuses.map(async (status) => {
      const result = await BookingService.listManageable(
        { store_id: storeId, status, date, page: 1, limit: 1 }, signal,
      );
      return [status, result.meta.total] as const;
    }));
    return Object.fromEntries(entries) as StoreBookingCounts;
  },

  // N đơn đang diễn ra mới nhất của đúng cửa hàng; lấy chi tiết để có tên khách.
  // /bookings/manage không trả customer; /bookings/staff không lọc được cửa hàng.
  async getStorePendingOrders(
    storeId: number,
    limit = 5,
    signal?: AbortSignal,
  ): Promise<StaffBookingDetail[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError("limit must be an integer between 1 and 100");
    }
    const pages = await Promise.all(ACTIVE_STATUSES.map((status) =>
      BookingService.listManageable(
        { store_id: storeId, status, page: 1, limit }, signal,
      ),
    ));
    const bookings = pages.flatMap((page) => page.data)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id)
      .slice(0, limit);
    return Promise.all(bookings.map((booking) =>
      staffService.getBookingDetail(booking.id, signal),
    ));
  },
};
