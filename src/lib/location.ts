import axiosInstance from "./axios";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Gọi Geolocation API. Trình duyệt sẽ tự hiện hộp thoại xin quyền nếu chưa cấp.
export function getCurrentCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Trình duyệt không hỗ trợ định vị."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

// Reverse geocoding: tọa độ -> địa chỉ, gọi qua backend (GET /maps/reverse-geocode)
export async function reverseGeocode({
  latitude,
  longitude,
}: Coordinates): Promise<string> {
  const { data } = await axiosInstance.get<{ address: string }>(
    "/maps/reverse-geocode",
    { params: { lat: latitude, lng: longitude } },
  );

  return data.address;
}
