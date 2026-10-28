import axiosInstance from "../lib/axios";
import type { GetUsersParams, PaginatedUsers } from "../types/user";

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
