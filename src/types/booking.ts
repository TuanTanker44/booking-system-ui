// Kiểu dữ liệu theo đúng backend (snake_case), khớp BookingController của nestjs-laundry-booking-system.

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "picked_up"
  | "processing"
  | "ready_for_delivery"
  | "delivering"
  | "completed"
  | "cancelled"
  | "no_show";

export type PricingUnit = "per_kg" | "per_item";

export interface BookingDeliveryTrip {
  id: number;
  booking_id: number;
  trip_type: "pickup" | "delivery";
  shipper_id: number | null;
  address_id: number;
  scheduled_time: string;
  started_at: string | null;
  completed_at: string | null;
  status: "unassigned" | "assigned" | "in_progress" | "completed" | "failed" | "cancelled";
  shipper: {
    id: number;
    full_name: string;
    phone: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export interface BookingItemInput {
  item_name: string;
  category?: string;
  // 1 - 100
  quantity: number;
  note?: string;
}

// Body của POST /bookings và POST /bookings/quote.
// - in_store = true: khách tự mang đồ đến, KHÔNG được gửi địa chỉ.
// - in_store = false: bắt buộc có pickup_address_id; không gửi delivery_address_id thì giao về chỗ lấy đồ.
// - Dịch vụ per_kg bắt buộc estimated_weight_kg; per_item bắt buộc items.
// - pickup_date (YYYY-MM-DD) và slot_start (HH:mm) lấy từ getAvailableSlots, đặt trước tối đa 7 ngày.
export interface CreateBookingInput {
  store_id: number;
  service_id: number;
  in_store: boolean;
  pickup_date: string;
  slot_start: string;
  pickup_address_id?: number;
  delivery_address_id?: number;
  // 0.1 - 9999.99, tối đa 2 chữ số thập phân
  estimated_weight_kg?: number;
  // Tối đa 50 món
  items?: BookingItemInput[];
  promotion_code?: string;
  special_instructions?: string;
}

export interface BookingItem {
  id: number;
  booking_id: number;
  item_name: string;
  category: string | null;
  quantity: number;
  unit_price: number | null;
  note: string | null;
  created_at: string;
}

export interface Booking {
  delivery_trips?: BookingDeliveryTrip[];
  id: number;
  booking_code: string;
  qr_token: string | null;
  customer_id: number;
  store_id: number;
  service_id: number;
  service_name: string;
  pricing_unit: PricingUnit;
  unit_price: number;
  in_store: boolean;
  pickup_address_id: number | null;
  delivery_address_id: number | null;
  scheduled_pickup_start: string;
  scheduled_pickup_end: string;
  estimated_delivery_at: string | null;
  status: BookingStatus;
  estimated_weight_kg: number | null;
  actual_weight_kg: number | null;
  estimated_price: number;
  final_price: number | null;
  discount_amount: number;
  delivery_price: number | null;
  promotion_id: number | null;
  special_instructions: string | null;
  cancelled_by: number | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Chỉ có ở kết quả tạo đơn, chi tiết đơn, hủy đơn và đổi trạng thái
  booking_items?: BookingItem[];
}

// GET /bookings/:id kèm thông tin cửa hàng
export interface BookingDetail extends Booking {
  store: { id: number; name: string; address: string };
}

// Kết quả POST /bookings/quote: xem trước giá và chỗ trống, không tạo đơn
export interface BookingQuote {
  store_id: number;
  service: {
    id: number;
    name: string;
    pricing_unit: PricingUnit;
    unit_price: number;
  };
  pickup_date: string;
  slot_start: string;
  slots_left: number;
  subtotal: number;
  discount_amount: number;
  delivery_price: number | null;
  estimated_price: number;
  estimated_delivery_at: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedBookings {
  data: Booking[];
  meta: PaginationMeta;
}

export interface MyBookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}

// Chỉ admin / laundry_staff
export interface ManageBookingsParams extends MyBookingsParams {
  store_id?: number;
  // Ngày lấy đồ, YYYY-MM-DD
  date?: string;
}

export interface CancelBookingResult {
  booking: Booking;
  // 100 hoặc 0. Khách hủy muộn hơn 2 giờ trước giờ lấy thì hoàn 0%; đơn chưa thanh toán luôn là 0.
  refund_percent: number;
}

export interface UpdateBookingStatusInput {
  // Hủy đơn dùng cancel(), không dùng API này
  status: Exclude<BookingStatus, "cancelled">;
  // Bắt buộc khi chuyển sang "processing" với dịch vụ per_kg
  actual_weight_kg?: number;
}
