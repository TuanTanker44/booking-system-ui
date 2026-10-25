import type { User } from '../types/user';

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem('user');

  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function hasAccessToken(): boolean {
  return Boolean(localStorage.getItem('accessToken'));
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}
