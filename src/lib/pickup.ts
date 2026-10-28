// yyyy-mm-dd theo giờ địa phương (toISOString trả về giờ UTC nên lệch ngày)
export function toLocalDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Backend chỉ cho đặt lịch trước tối đa bấy nhiêu ngày (MAX_ADVANCE_DAYS)
export const MAX_ADVANCE_DAYS = 7;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
