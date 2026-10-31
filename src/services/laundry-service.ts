import axiosInstance from "../lib/axios";
import type { StoreService } from "../types/store-booking";

// Staff/admin: dịch vụ riêng của cửa hàng, gồm cả active và inactive.
export async function getManageableStoreServices(
  storeId: number,
  signal?: AbortSignal,
): Promise<StoreService[]> {
  const { data } = await axiosInstance.get<{ data: StoreService[] }>(
    `/stores/${storeId}/services/manage`,
    { signal },
  );
  return data.data;
}
