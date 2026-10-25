import axiosInstance from "../lib/axios";
import type { AuthResponse, LoginDto, RegisterDto } from "../types/auth";
import type { User } from "../types/user";

export const AuthService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      dto,
    );
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      dto,
    );
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await axiosInstance.get<User>("/users/me");
    return data;
  },

  async refresh(): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>(
      "/auth/refresh",
      {
        body: {
          refreshToken: localStorage.getItem("refreshToken"),
        }
      }
    );

    return data;
  },

  async logout(): Promise<void> {
    await axiosInstance.post("/auth/logout");
  },
}