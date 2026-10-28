import axiosInstance from "../lib/axios";
import type { Address, AddressInput, ApiAddress } from "../types/address";

function toAddress(api: ApiAddress): Address {
  return {
    id: api.id,
    label: api.label,
    recipientName: api.recipient_name,
    phone: api.phone,
    addressLine: api.address_line,
    ward: api.ward,
    district: api.district,
    city: api.city,
    latitude: api.latitude ?? null,
    longitude: api.longitude ?? null,
    isDefault: api.is_default,
  };
}

function toApiBody(input: AddressInput) {
  return {
    label: input.label,
    recipient_name: input.recipientName,
    phone: input.phone,
    address_line: input.addressLine,
    ward: input.ward,
    district: input.district,
    city: input.city,
    is_default: input.isDefault,
  };
}

// Hiển thị địa chỉ đầy đủ trên một dòng
export function formatAddress(address: Address): string {
  return [address.addressLine, address.ward, address.district, address.city]
    .filter(Boolean)
    .join(", ");
}

export const AddressService = {
  // Backend có thể trả mảng trực tiếp hoặc bọc trong { data }
  async list(): Promise<Address[]> {
    const { data } = await axiosInstance.get<ApiAddress[] | { data: ApiAddress[] }>(
      "/addresses",
    );

    return (Array.isArray(data) ? data : data.data).map(toAddress);
  },

  async create(input: AddressInput): Promise<void> {
    await axiosInstance.post("/addresses", toApiBody(input));
  },

  async update(id: number, input: AddressInput): Promise<void> {
    await axiosInstance.patch(`/addresses/${id}`, toApiBody(input));
  },

  async setDefault(id: number): Promise<void> {
    await axiosInstance.patch(`/addresses/${id}`, { is_default: true });
  },

  async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/addresses/${id}`);
  },
};
