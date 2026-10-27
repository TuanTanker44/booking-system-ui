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

// Refresh token do backend đặt trong cookie httpOnly nên không có ở đây
export interface AuthResponse {
  accessToken: string;
}