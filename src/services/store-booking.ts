import axiosInstance from "../lib/axios";
import type { PricingUnit } from "../types/booking";
import type { AvailableSlots, StoreService } from "../types/store-booking";

// Các API công khai của cửa hàng mà luồng đặt lịch cần:
// dịch vụ của cửa hàng và khung giờ còn chỗ.

// GET /stores/:storeId/services?pricing_unit=&search=
export async function getStoreServices(
  storeId: number,
  params: { pricing_unit?: PricingUnit; search?: string } = {},
  signal?: AbortSignal,
): Promise<StoreService[]> {
  const { data } = await axiosInstance.get<{ data: StoreService[] }>(
    `/stores/${storeId}/services`,
    { params, signal },
  );
  return data.data;
}

// GET /stores/:storeId/available-slots?date=YYYY-MM-DD
// Ngày không được ở quá khứ. Hôm nay thì backend đã bỏ các slot đã bắt đầu.
export async function getAvailableSlots(
  storeId: number,
  date: string,
  signal?: AbortSignal,
): Promise<AvailableSlots> {
  const { data } = await axiosInstance.get<{ data: AvailableSlots }>(
    `/stores/${storeId}/available-slots`,
    { params: { date }, signal },
  );
  return data.data;
}
