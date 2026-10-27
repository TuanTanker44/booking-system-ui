// Danh mục hành chính hard-code, tạm thời chỉ có Hà Nội.
// Tên không kèm tiền tố (Quận/Huyện/Phường/Xã).

export const CITIES = ["Hà Nội"] as const;

export const DEFAULT_CITY = CITIES[0];

// Quận/huyện/thị xã của Hà Nội
const HANOI_DISTRICTS = [
  "Ba Đình", "Hoàn Kiếm", "Tây Hồ", "Long Biên", "Cầu Giấy", "Đống Đa",
  "Hai Bà Trưng", "Hoàng Mai", "Thanh Xuân", "Hà Đông", "Bắc Từ Liêm", "Nam Từ Liêm",
  "Sơn Tây", "Ba Vì", "Chương Mỹ", "Đan Phượng", "Đông Anh", "Gia Lâm",
  "Hoài Đức", "Mê Linh", "Mỹ Đức", "Phú Xuyên", "Phúc Thọ", "Quốc Oai",
  "Sóc Sơn", "Thạch Thất", "Thanh Oai", "Thanh Trì", "Thường Tín", "Ứng Hòa",
];

// Phường của 12 quận nội thành. Quận/huyện/thị xã còn lại chưa có dữ liệu
// nên form cho nhập tay phường/xã.
const HANOI_WARDS: Record<string, string[]> = {
  "Ba Đình": [
    "Phúc Xá", "Trúc Bạch", "Vĩnh Phúc", "Cống Vị", "Liễu Giai", "Nguyễn Trung Trực", "Quán Thánh",
    "Ngọc Hà", "Điện Biên", "Đội Cấn", "Ngọc Khánh", "Kim Mã", "Giảng Võ", "Thành Công",
  ],
  "Hoàn Kiếm": [
    "Phúc Tân", "Đồng Xuân", "Hàng Mã", "Hàng Buồm", "Hàng Đào", "Hàng Bồ", "Cửa Đông", "Lý Thái Tổ",
    "Hàng Bạc", "Hàng Gai", "Chương Dương", "Hàng Trống", "Cửa Nam", "Hàng Bông", "Tràng Tiền",
    "Trần Hưng Đạo", "Phan Chu Trinh", "Hàng Bài",
  ],
  "Tây Hồ": ["Bưởi", "Yên Phụ", "Thụy Khuê", "Tứ Liên", "Quảng An", "Nhật Tân", "Xuân La", "Phú Thượng"],
  "Long Biên": [
    "Thượng Thanh", "Ngọc Thụy", "Giang Biên", "Đức Giang", "Việt Hưng", "Gia Thụy", "Ngọc Lâm",
    "Phúc Lợi", "Bồ Đề", "Long Biên", "Sài Đồng", "Phúc Đồng", "Thạch Bàn", "Cự Khối",
  ],
  "Cầu Giấy": [
    "Dịch Vọng", "Dịch Vọng Hậu", "Mai Dịch", "Nghĩa Đô", "Nghĩa Tân", "Quan Hoa", "Trung Hòa", "Yên Hòa",
  ],
  "Đống Đa": [
    "Cát Linh", "Hàng Bột", "Quốc Tử Giám", "Văn Miếu", "Văn Chương", "Láng Hạ", "Láng Thượng",
    "Ô Chợ Dừa", "Nam Đồng", "Trung Liệt", "Thịnh Quang", "Quang Trung", "Thổ Quan", "Phương Liên",
    "Phương Mai", "Khâm Thiên", "Trung Phụng", "Kim Liên", "Khương Thượng", "Trung Tự",
  ],
  "Hai Bà Trưng": [
    "Nguyễn Du", "Bạch Đằng", "Phạm Đình Hổ", "Lê Đại Hành", "Đồng Nhân", "Phố Huế", "Đống Mác",
    "Thanh Lương", "Thanh Nhàn", "Cầu Dền", "Bách Khoa", "Đồng Tâm", "Vĩnh Tuy", "Bạch Mai",
    "Quỳnh Mai", "Quỳnh Lôi", "Minh Khai", "Trương Định",
  ],
  "Hoàng Mai": [
    "Thanh Trì", "Vĩnh Hưng", "Định Công", "Mai Động", "Tương Mai", "Đại Kim", "Tân Mai",
    "Hoàng Văn Thụ", "Giáp Bát", "Lĩnh Nam", "Thịnh Liệt", "Trần Phú", "Hoàng Liệt", "Yên Sở",
  ],
  "Thanh Xuân": [
    "Nhân Chính", "Thượng Đình", "Khương Trung", "Khương Mai", "Thanh Xuân Trung", "Phương Liệt",
    "Hạ Đình", "Khương Đình", "Thanh Xuân Bắc", "Thanh Xuân Nam", "Kim Giang",
  ],
  "Hà Đông": [
    "Nguyễn Trãi", "Mộ Lao", "Văn Quán", "Vạn Phúc", "Yết Kiêu", "Quang Trung", "La Khê", "Phú La",
    "Phúc La", "Hà Cầu", "Yên Nghĩa", "Kiến Hưng", "Phú Lãm", "Phú Lương", "Dương Nội", "Đồng Mai",
    "Biên Giang",
  ],
  "Bắc Từ Liêm": [
    "Thượng Cát", "Liên Mạc", "Đông Ngạc", "Đức Thắng", "Thụy Phương", "Tây Tựu", "Xuân Đỉnh",
    "Xuân Tảo", "Minh Khai", "Cổ Nhuế 1", "Cổ Nhuế 2", "Phú Diễn", "Phúc Diễn",
  ],
  "Nam Từ Liêm": [
    "Cầu Diễn", "Xuân Phương", "Phương Canh", "Mỹ Đình 1", "Mỹ Đình 2", "Tây Mỗ", "Mễ Trì",
    "Phú Đô", "Đại Mỗ", "Trung Văn",
  ],
};

export function getDistricts(city: string): string[] {
  return city === "Hà Nội" ? HANOI_DISTRICTS : [];
}

// Rỗng nếu chưa có dữ liệu phường/xã của quận/huyện đó
export function getWards(city: string, district: string): string[] {
  return city === "Hà Nội" ? (HANOI_WARDS[district] ?? []) : [];
}

const ADMIN_PREFIX = /^(thành phố|tp\.?|tỉnh|quận|huyện|thị xã|thị trấn|phường|xã|q\.|h\.|tx\.|tt\.|p\.|x\.)\s+/i;

// Bỏ tiền tố hành chính: "Phường Dịch Vọng Hậu" -> "Dịch Vọng Hậu"
export function stripAdminPrefix(value: string): string {
  return value.trim().replace(ADMIN_PREFIX, "");
}

// So khớp không phân biệt hoa thường, dấu và tiền tố hành chính
function normalizeName(value: string): string {
  return stripAdminPrefix(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

// Tìm tên chuẩn trong danh sách, ví dụ "Phường Dịch Vọng Hậu" hoặc "Cau Giay" -> tên có dấu. Không khớp trả về "".
export function matchName(options: string[], value: string): string {
  const target = normalizeName(value);
  return options.find((option) => normalizeName(option) === target) ?? "";
}
