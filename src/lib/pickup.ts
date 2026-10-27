// Khung giờ lấy đồ: [nhãn hiển thị, giờ kết thúc (phút trong ngày)]
export const PICKUP_SLOTS = [
  { label: "09:00 - 11:00", endMinutes: 11 * 60 },
  { label: "11:00 - 13:00", endMinutes: 13 * 60 },
  { label: "14:00 - 16:00", endMinutes: 16 * 60 },
  { label: "17:00 - 19:00", endMinutes: 19 * 60 },
] as const;

// yyyy-mm-dd theo giờ địa phương (toISOString trả về giờ UTC nên lệch ngày)
export function toLocalDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Khung giờ còn khả dụng: ngày sau hôm nay luôn được; hôm nay thì khung giờ chưa kết thúc.
// Khung giờ đang diễn ra vẫn được chọn.
export function isSlotAvailable(date: string, slotLabel: string, now: Date = new Date()): boolean {
  const today = toLocalDateString(now);
  if (date > today) return true;
  if (date < today) return false;

  const slot = PICKUP_SLOTS.find((item) => item.label === slotLabel);
  if (!slot) return false;

  return slot.endMinutes > now.getHours() * 60 + now.getMinutes();
}

export function firstAvailableSlot(date: string, now: Date = new Date()): string | undefined {
  return PICKUP_SLOTS.find((slot) => isSlotAvailable(date, slot.label, now))?.label;
}

// Mặc định: hôm nay + khung giờ hiện tại (hoặc gần nhất sắp tới); hết khung giờ hôm nay thì sang ngày mai
export function getDefaultPickup(now: Date = new Date()): { date: string; time: string } {
  const today = toLocalDateString(now);
  const slot = firstAvailableSlot(today, now);
  if (slot) return { date: today, time: slot };

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = toLocalDateString(tomorrow);
  return { date, time: firstAvailableSlot(date, now) ?? PICKUP_SLOTS[0].label };
}
