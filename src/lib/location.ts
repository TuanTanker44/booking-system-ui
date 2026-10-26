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

// Khu vực của người dùng, đúng dạng body của POST /stores/top-selling/area
export interface CurrentLocation {
  ward: string;
  district: string;
  city: string;
}

const WARD_PREFIX = /^(phường|xã|thị trấn|p\.|x\.|tt\.)\s+/i;
const DISTRICT_PREFIX = /^(quận|huyện|thị xã|q\.|h\.|tx\.)\s+/i;

// Tách địa chỉ (vd. "17 Phố Trần Nguyên Hãn, Khu phố cổ, Hoàn Kiếm, Hà Nội, Việt Nam")
// thành currentLocation { ward, district, city }. Trả về null nếu không xác định được thành phố.
export function parseCurrentLocation(address: string): CurrentLocation | null {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean)
    // Bỏ quốc gia và mã bưu chính ở cuối địa chỉ
    .filter((segment) => !/^(việt nam|vietnam)$/i.test(segment))
    .filter((segment) => !/^\d{4,6}$/.test(segment));

  if (segments.length === 0) return null;

  // Phần tử cuối là tỉnh/thành phố
  const city = segments[segments.length - 1];
  const rest = segments.slice(0, -1);

  // Ưu tiên nhận diện theo tiền tố (Phường/Xã, Quận/Huyện), nếu không có thì
  // lấy theo vị trí: [..., phường/xã, quận/huyện, tỉnh/thành phố]
  const ward =
    rest.find((segment) => WARD_PREFIX.test(segment)) ??
    (segments.length >= 4 ? segments[segments.length - 3] : "");
  const district =
    rest.find((segment) => DISTRICT_PREFIX.test(segment)) ??
    (segments.length >= 3 ? segments[segments.length - 2] : "");

  return { ward, district, city };
}
