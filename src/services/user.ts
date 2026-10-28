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

export async function updateProfile(
  payload: UpdateUserPayload,
) {
  const { data } = await axiosInstance.patch(
    `/users/me`,
    payload,
  );

  return data;
}

export async function changePassword(
  payload: ChangePaswordPayload
) {
  const { data } = await axiosInstance.patch(
    `/users/change-password`,
    payload,
  );

  return data;
}
