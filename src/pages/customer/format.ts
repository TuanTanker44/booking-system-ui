import type { BookingStatus } from "../../types/booking";

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

export const statusClass = (status: BookingStatus) =>
  status === "completed" ? "success"
    : status === "cancelled" || status === "no_show" ? "danger"
      : status === "ready_for_delivery" || status === "delivering" ? "purple"
        : "blue";

// Giờ lấy đồ được backend lưu theo "giờ cửa hàng" và trả về dạng ISO có hậu tố Z,
// nên chỉ cắt chuỗi, không đổi múi giờ.
export const formatStoreDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
export const formatStoreTime = (iso: string) => iso.slice(11, 16);
export const formatPickupSlot = (start: string, end: string) =>
  `${formatStoreDate(start)} · ${formatStoreTime(start)} - ${formatStoreTime(end)}`;
