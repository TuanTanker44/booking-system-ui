import type { Booking, BookingDeliveryTrip, BookingStatus, PaginationMeta, PricingUnit } from "./booking";

// /bookings/staff trả trực tiếp Prisma Decimal dưới dạng chuỗi JSON.
export type ApiDecimal = string;

export interface StaffCustomer {
  id: number;
  full_name: string;
  phone: string | null;
}

export interface Shipper {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: "active" | "inactive" | "banned";
}

export interface PaginatedShippers {
  data: Shipper[];
  meta: PaginationMeta;
}

export interface AssignedDeliveryTrip {
  id: number;
  booking_id: number;
  trip_type: "delivery";
  shipper_id: number;
  status: "assigned";
}

export interface StoreStaffBooking extends Booking {
  customer: StaffCustomer | null;
}

export interface StaffBooking {
  delivery_trips: BookingDeliveryTrip[];
  id: number;
  booking_code: string;
  status: BookingStatus;
  scheduled_pickup_start: string;
  scheduled_pickup_end: string;
  estimated_delivery_at: string | null;
  estimated_price: ApiDecimal;
  created_at: string;
  service_name: string;
  pricing_unit: PricingUnit;
  estimated_weight_kg: ApiDecimal | null;
  users_bookings_customer_idTousers: StaffCustomer;
}

export interface StaffBookingAddress {
  recipient_name: string;
  phone: string;
  address_line: string;
  ward: string | null;
  district: string | null;
  city: string | null;
}

export interface StaffBookingDetail extends StaffBooking {
  in_store: boolean;
  actual_weight_kg: ApiDecimal | null;
  final_price: ApiDecimal | null;
  discount_amount: ApiDecimal;
  unit_price: ApiDecimal;
  delivery_price: ApiDecimal | null;
  special_instructions: string | null;
  cancellation_reason: string | null;
  updated_at: string;
  users_bookings_customer_idTousers: StaffCustomer & { email: string };
  addresses_bookings_pickup_address_idToaddresses: StaffBookingAddress | null;
  addresses_bookings_delivery_address_idToaddresses: StaffBookingAddress | null;
  booking_items: {
    id: number;
    item_name: string;
    category: string | null;
    quantity: number;
    unit_price: ApiDecimal | null;
    note: string | null;
  }[];
  services: {
    id: number;
    name: string;
    description: string | null;
    pricing_unit: PricingUnit;
    unit_price: ApiDecimal;
  };
  laundry_stores: {
    id: number;
    name: string;
    phone: string | null;
    address: string;
  };
}

export interface StaffBookingsParams {
  page?: number;
  limit?: number;
}

export interface PaginatedStaffBookings {
  data: StaffBooking[];
  // Khác /bookings/manage (meta), route /bookings/staff dùng pagination.
  pagination: PaginationMeta;
}

export type StoreBookingCounts = Record<BookingStatus, number>;

export type MachineType = "washer" | "dryer" | "washer_dryer";
export type ApiMachineStatus = "idle" | "running" | "maintenance" | "offline";

export interface StoreMachine {
  // Có khi GET danh sách máy với booking_id; khác trạng thái vận hành hiện tại.
  current_status?: ApiMachineStatus;
  available_for_booking?: boolean;
  assigned_to_booking?: boolean;
  id: number;
  store_id: number;
  name: string;
  type: MachineType;
  capacity_kg: number;
  status: ApiMachineStatus;
  created_at: string;
  updated_at: string;
  current_usage: {
    log_id: number;
    booking_id: number;
    booking_code: string;
    started_at: string;
  } | null;
}

export interface MachinesParams {
  booking_id?: number;
  page?: number;
  limit?: number;
  type?: MachineType;
  status?: ApiMachineStatus;
}

export interface MachineUsageLog {
  id: number;
  booking_id: number;
  booking_code: string;
  started_at: string;
  ended_at: string | null;
}

export interface MachineUsageParams {
  page?: number;
  limit?: number;
  // YYYY-MM-DD theo giờ cửa hàng; bao gồm cả ngày to.
  from?: string;
  to?: string;
}

export interface PaginatedMachines {
  data: StoreMachine[];
  meta: PaginationMeta;
}

export interface PaginatedMachineUsage {
  data: MachineUsageLog[];
  meta: PaginationMeta;
}
