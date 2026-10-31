// Dữ liệu backend trả về (snake_case)
export interface ApiAddress {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  ward: string;
  district: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

export interface Address {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

// Dữ liệu form tạo/sửa địa chỉ
export interface AddressInput {
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
  latitude: number;
  longitude: number;
}
