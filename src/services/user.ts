import type { User } from "../types/user";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

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
  const query = new URLSearchParams();

  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }

  if (params.limit !== undefined) {
    query.set("limit", String(params.limit));
  }

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.role && params.role !== "ALL") {
    query.set("role", params.role);
  }

  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }

  const queryString = query.toString();
  const url = `${API_URL}/users${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Cannot fetch users (${response.status})`);
  }

  return (await response.json()) as PaginatedUsers;
}