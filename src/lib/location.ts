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

interface NominatimResponse {
  display_name?: string;
}

// Reverse geocoding: tọa độ -> địa chỉ (OpenStreetMap Nominatim).
// Có thể thay bằng endpoint Maps API của backend khi có.
export async function reverseGeocode({
  latitude,
  longitude,
}: Coordinates): Promise<string> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    "accept-language": "vi",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
  );

  if (!response.ok) {
    throw new Error("Không thể xác định địa chỉ từ vị trí hiện tại.");
  }

  const data = (await response.json()) as NominatimResponse;

  if (!data.display_name) {
    throw new Error("Không tìm thấy địa chỉ tại vị trí hiện tại.");
  }

  return data.display_name;
}
