/**
 * Định dạng timestamp hoặc Date thành ngày tháng tiếng Việt.
 */
export function formatDate(
  date: Date | number = Date.now(),
): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date instanceof Date ? date : new Date(date));
}