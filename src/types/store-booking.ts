import type { PricingUnit } from "./booking";

// Các API công khai của cửa hàng mà luồng đặt lịch cần:
// dịch vụ của cửa hàng và khung giờ còn chỗ.

export interface StoreService {
  id: number;
  // null: dịch vụ dùng chung cho mọi cửa hàng
  store_id: number | null;
  name: string;
  description: string | null;
  pricing_unit: PricingUnit;
  unit_price: number;
  estimated_turnaround_hours: number;
  status: "active" | "inactive";
  scope: "global" | "store";
}

export interface AvailableSlot {
  // HH:mm
  start: string;
  end: string;
  capacity: number;
  booked: number;
  available: number;
  is_available: boolean;
}

export interface AvailableSlots {
  // YYYY-MM-DD
  date: string;
  // false: cửa hàng nghỉ hôm đó, slots rỗng
  is_open: boolean;
  reason: string | null;
  open_time: string | null;
  close_time: string | null;
  slot_duration_minutes?: number;
  slots: AvailableSlot[];
}
