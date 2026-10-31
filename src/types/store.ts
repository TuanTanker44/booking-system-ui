export interface ApiStore {
  id: number;
  name: string;
  address: string;
  description: string | null;
  phone: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  // Chỉ có khi gửi kèm lat và lng
  distance_km?: number | null;
}

export interface PaginatedStores {
  data: ApiStore[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SearchStoresParams {
  search?: string;
  page?: number;
  limit?: number;
  lat?: number;
  lng?: number;
}

export type StoreStatus = 'active' | 'inactive';

// Cửa hàng bán chạy: kèm số đơn đã hoàn thành (và điểm khớp khu vực nếu lọc theo khu vực)
export interface TopSellingStore extends Omit<ApiStore, "latitude" | "longitude"> {
  completedBookings: number;
  areaScore?: number;
}
