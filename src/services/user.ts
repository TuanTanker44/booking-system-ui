import axiosInstance from "../lib/axios";
import type { User } from "../types/user";

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: User["role"] | "ALL";
  status?: User["status"] | "ALL";
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getUsers(
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
}
