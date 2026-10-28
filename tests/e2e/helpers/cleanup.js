import { API_URL } from './driver.js';

export async function getToken(driver) {
  return await driver.executeScript('return localStorage.getItem("accessToken")');
}

async function apiFetch(driver, method, path, body) {
  const token = await getToken(driver);
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

export async function cleanupAddress(driver, addressId) {
  if (!addressId) return;
  try { await apiFetch(driver, 'DELETE', `/addresses/${addressId}`); } catch {}
}

export async function cleanupBooking(driver, bookingId) {
  if (!bookingId) return;
  try { await apiFetch(driver, 'POST', `/bookings/${bookingId}/cancel`, {}); } catch {}
}

export async function listAddresses(driver) {
  const res = await apiFetch(driver, 'GET', '/addresses');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}

export async function listBookings(driver) {
  const res = await apiFetch(driver, 'GET', '/bookings?limit=100');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}
