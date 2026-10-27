import axiosInstance from "../lib/axios";
import type { AuthResponse, LoginDto, RegisterDto, ResendVerificationDto } from "../types/auth";
import type { User, UserRole, UserStatus } from "../types/user";

// Dữ liệu backend trả về (snake_case, enum chữ thường)
interface ApiUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "admin" | "laundry_staff" | "shipper" | "customer";
  status: "active" | "inactive" | "banned";
  created_at: string;
}

const ROLE_MAP: Record<ApiUser["role"], UserRole> = {
  admin: "ADMIN",
  laundry_staff: "STAFF",
  shipper: "SHIPPER",
  customer: "CUSTOMER",
};

const STATUS_MAP: Record<ApiUser["status"], UserStatus> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  banned: "BANNED",
};

function toUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    fullName: apiUser.full_name,
    avatarUrl: apiUser.avatar_url,
    email: apiUser.email,
    phone: apiUser.phone ?? "",
    role: ROLE_MAP[apiUser.role],
    status: STATUS_MAP[apiUser.status],
    createdAt: apiUser.created_at,
  };
}

interface ApiTokenResponse {
  access_token: string;
}

export const AuthService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<ApiTokenResponse>(
      "/auth/login",
      dto,
    );
    return { accessToken: data.access_token };
  },

  // Register chỉ tạo tài khoản, không trả token
  async register(dto: RegisterDto): Promise<void> {
    await axiosInstance.post("/auth/register", dto);
  },

  async getMe(): Promise<User> {
    const { data } = await axiosInstance.get<ApiUser>("/users/me");
    return toUser(data);
  },

  // Refresh token nằm trong cookie httpOnly, backend tự đọc từ cookie
  async refresh(): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<ApiTokenResponse>(
      "/auth/refresh",
    );
    return { accessToken: data.access_token };
  },

  async logout(): Promise<void> {
    await axiosInstance.post("/auth/logout");
  },

  // Xác minh email bằng token trong link gửi qua mail
  async verifyEmail(token: string): Promise<void> {
    await axiosInstance.post("/auth/verify-email", { token });
  },

  async resendVerification(dto: ResendVerificationDto): Promise<void> {
    await axiosInstance.post("/auth/resend-verification", dto);
  }
};
