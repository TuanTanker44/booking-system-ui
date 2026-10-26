import axiosInstance from "../lib/axios";

export interface ApiStore {
  id: number;
  name: string;
  address: string;
  description: string | null;
  phone: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  // Chỉ có khi gửi kèm lat và lng
  distance_km?: number | null;
}

export interface PaginatedStores {
  data: ApiStore[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SearchStoresParams {
  search?: string;
  page?: number;
  limit?: number;
  lat?: number;
  lng?: number;
}

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
