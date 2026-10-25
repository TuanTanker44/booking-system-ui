export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED" | "PENDING";

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}