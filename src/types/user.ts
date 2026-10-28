export type UserRole = 'ADMIN' | 'STAFF' | 'SHIPPER' | 'CUSTOMER';

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED" | "PENDING";

export interface User {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

// Dữ liệu backend trả về (snake_case, enum chữ thường)
export interface ApiUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "admin" | "laundry_staff" | "shipper" | "customer";
  status: "active" | "inactive" | "banned";
  created_at: string;
}

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