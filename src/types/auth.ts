export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface ResendVerificationDto {
  email: string;
}

// Dữ liệu backend trả về khi login / refresh (snake_case)
export interface ApiTokenResponse {
  access_token: string;
}

// Refresh token do backend đặt trong cookie httpOnly nên không có ở đây
export interface AuthResponse {
  accessToken: string;
}