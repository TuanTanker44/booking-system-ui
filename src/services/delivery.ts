import axiosInstance from "../lib/axios";

export interface DeliveryFeeQuote {
  pickup: { address_id: number; distance_km: number; fee: number };
  delivery: { address_id: number; distance_km: number; fee: number };
  total_fee: number;
}

// baseURL đã chứa /api. Bỏ delivery_address_id để giao trả về địa chỉ lấy đồ.
export async function getDeliveryFee(
  params: { store_id: number; pickup_address_id: number; delivery_address_id?: number },
  signal?: AbortSignal,
): Promise<DeliveryFeeQuote> {
  const { data } = await axiosInstance.get<{ data: DeliveryFeeQuote }>("/delivery/fee", { params, signal });
  return data.data;
}
