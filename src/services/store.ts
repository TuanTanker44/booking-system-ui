import axiosInstance from "../lib/axios";
import type { CurrentLocation } from "../lib/location";
import type {
  ApiStore,
  PaginatedStores,
  SearchStoresParams,
  StoreStatus,
  TopSellingStore,
} from "../types/store";

export interface AdminStore extends ApiStore {
  status?: StoreStatus;
  cancellation_hours_before?: number;
  cancellation_refund_percent?: number;
  created_at?: string;
  staffs?: Array<{
    id: number;
    full_name: string;
    email: string;
    phone?: string | null;
  }>;
}

export interface PaginatedAdminStores {
  data: AdminStore[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateStorePayload {
  name: string;
  address: string;
  phone?: string;
  description?: string;
  image_url?: string;
  cancellation_hours_before?: number;
  cancellation_refund_percent?: number;
  status?: StoreStatus;
}

export type UpdateStorePayload = Partial<CreateStorePayload>;

// GET /stores?search=&page=1&limit=10
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

// GET /stores/top-selling
export async function getTopSellingStores(
  signal?: AbortSignal,
): Promise<TopSellingStore[]> {
  const { data } = await axiosInstance.get<TopSellingStore[]>(
    "/stores/top-selling",
    { signal },
  );

  return data;
}

// POST /stores/top-selling/area
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

// ==================== ADMIN STORE APIs ====================

export const adminStoreService = {
  async getManageableStores(
    params: { search?: string; page?: number; limit?: number } = {},
  ): Promise<PaginatedAdminStores> {
    const { data } = await axiosInstance.get<PaginatedAdminStores>(
      "/stores/manage",
      {
        params: {
          search: params.search?.trim() || undefined,
          page: params.page ?? 1,
          limit: params.limit ?? 20,
        },
      },
    );
    return data;
  },

  async createStore(payload: CreateStorePayload) {
    const { data } = await axiosInstance.post<{
      message: string;
      data: AdminStore;
    }>("/stores", payload);
    return data.data;
  },

  async updateStore(id: number, payload: UpdateStorePayload) {
    const { data } = await axiosInstance.patch<{
      message: string;
      data: AdminStore;
    }>(`/stores/${id}`, payload);
    return data.data;
  },

  async deactivateStore(id: number) {
    const { data } = await axiosInstance.delete(`/stores/${id}`);
    return data;
  },

  async assignStaff(storeId: number, staffId: number) {
    const { data } = await axiosInstance.post(`/stores/${storeId}/staff`, {
      staff_id: staffId,
    });
    return data;
  },

  async unassignStaff(storeId: number, staffId: number) {
    const { data } = await axiosInstance.delete(
      `/stores/${storeId}/staff/${staffId}`,
    );
    return data;
  },
};