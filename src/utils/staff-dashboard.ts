import type { Booking } from "../types/booking";
import type { StoreBookingCounts } from "../types/staff-api";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric", month: "2-digit", day: "2-digit",
});

function localDay(date: Date): string {
  const parts = dayFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// Hoàn thành/hủy là trạng thái hiện tại, nhóm theo NGÀY TẠO, không phải ngày đổi trạng thái.
export function summarizeStoreBookings(
  bookings: Pick<Booking, "status" | "created_at">[],
  now = new Date(),
) {
  const counts: StoreBookingCounts = {
    pending_payment: 0, confirmed: 0, picked_up: 0, processing: 0,
    ready_for_delivery: 0, delivering: 0, completed: 0, cancelled: 0, no_show: 0,
  };
  const today = new Date(`${localDay(now)}T00:00:00Z`);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
  const points = new Map(days.map((day) => [day, {
    date: `${day.slice(8, 10)}/${day.slice(5, 7)}`,
    newOrders: 0, completed: 0, cancelled: 0,
  }]));

  for (const booking of bookings) {
    counts[booking.status] += 1;
    const createdAt = new Date(booking.created_at);
    if (Number.isNaN(createdAt.getTime())) continue;
    const point = points.get(localDay(createdAt));
    if (!point) continue;
    point.newOrders += 1;
    if (booking.status === "completed") point.completed += 1;
    if (booking.status === "cancelled") point.cancelled += 1;
  }

  return { counts, chartData: [...points.values()] };
}
