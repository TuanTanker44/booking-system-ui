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