import axiosInstance from "../lib/axios";
import type { CurrentLocation } from "../lib/location";
import type { PaginatedStores, SearchStoresParams, TopSellingStore } from "../types/store";

// GET /stores?search=&page=1&limit=10
// Backend tìm theo tên, địa chỉ, mô tả hoặc số điện thoại.
export async function searchStores(
  { search, page = 1, limit = 10, lat, lng }: SearchStoresParams = {},
  signal?: AbortSignal,
): Promise<PaginatedStores> {
  const { data } = await axiosInstance.get<PaginatedStores>("/stores", {
    params: { search: search?.trim() ?? "", page, limit, lat, lng },
    signal,
  });

  return data;
}

// GET /stores/top-selling — dùng khi chưa có vị trí người dùng
export async function getTopSellingStores(
  signal?: AbortSignal,
): Promise<TopSellingStore[]> {
  const { data } = await axiosInstance.get<TopSellingStore[]>(
    "/stores/top-selling",
    { signal },
  );

  return data;
}

// POST /stores/top-selling/area — dùng khi người dùng cho phép truy cập vị trí
export async function getTopSellingStoresByArea(
  { ward, district, city }: CurrentLocation,
  signal?: AbortSignal,
): Promise<TopSellingStore[]> {
  const { data } = await axiosInstance.post<TopSellingStore[]>(
    "/stores/top-selling/area",
    { ward, district, city },
    { signal },
  );

  return data;
}
