import axiosInstance from "../lib/axios";
import type { GetUsersParams, PaginatedUsers } from "../types/user";
import type { StoreOption } from "../types/staff";
import type { StoreStatus } from "../types/store";
import type { PaginatedShippers, Shipper } from "../types/staff-api";

export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  role?: string;
  status?: string;
}

export interface ChangePaswordPayload {
  current_password: string;
  new_password: string;
}

export interface GetWorkingStoreResponse {
  id: number;
  name: string;
  address: string;
  phone: string;
  description: string;
  image_url: string | null;
  status: StoreStatus;
}

export const userService = {
  async getShippers(signal?: AbortSignal): Promise<Shipper[]> {
    const shippers: Shipper[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const { data } = await axiosInstance.get<PaginatedShippers>("/users/shippers", {
        params: { page, limit: 100, status: "active" }, signal,
      });
      shippers.push(...data.data);
      totalPages = data.meta.totalPages;
      page += 1;
    } while (page <= totalPages);
    return shippers;
  },

  async getUsers(
    params: GetUsersParams = {},
  ): Promise<PaginatedUsers> {
    const { data } = await axiosInstance.get<PaginatedUsers>("/users", {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search?.trim() || undefined,
        role: params.role !== "ALL" ? params.role : undefined,
        status: params.status !== "ALL" ? params.status : undefined,
      },
    });

    return data;
  },

  async updateProfile(payload: UpdateUserPayload) {
    const { data } = await axiosInstance.patch("/users/me", payload);

    return data;
  },

  async changePassword(payload: ChangePaswordPayload) {
    const { data } = await axiosInstance.patch(
      "/users/change-password",
      payload,
    );

    return data;
  },

  async getWorkingStore(signal?: AbortSignal): Promise<StoreOption[]> {
    const { data } = await axiosInstance.get<GetWorkingStoreResponse[]>(
      "/users/me/working-store",
      { signal },
    );

    return data.map((store) => ({ id: String(store.id), name: store.name }));
  },
};
