import axiosInstance from "../lib/axios";
import type {
  MachineUsageParams,
  MachinesParams,
  PaginatedMachines,
  PaginatedMachineUsage,
  StoreMachine,
} from "../types/staff-api";

// Các API nội bộ yêu cầu admin hoặc laundry_staff được gán vào cửa hàng.
export const machineService = {
  async assign(storeId: number, machineId: number, bookingId: number): Promise<StoreMachine> {
    const { data } = await axiosInstance.post<{ data: StoreMachine }>(
      `/stores/${storeId}/machines/${machineId}/assign`,
      { booking_id: bookingId },
    );
    return data.data;
  },

  async list(
    storeId: number,
    params: MachinesParams = {},
    signal?: AbortSignal,
  ): Promise<PaginatedMachines> {
    const { data } = await axiosInstance.get<PaginatedMachines>(
      `/stores/${storeId}/machines`,
      { params, signal },
    );
    return data;
  },

  // Lấy đủ các trang để mẫu số máy và số máy bảo trì không bị giới hạn ở trang 1.
  async listAll(storeId: number, signal?: AbortSignal, params: Pick<MachinesParams, "booking_id"> = {}): Promise<StoreMachine[]> {
    const first = await machineService.list(storeId, { ...params, page: 1, limit: 100 }, signal);
    const machines = [...first.data];
    for (let page = 2; page <= first.meta.totalPages; page += 1) {
      const next = await machineService.list(storeId, { ...params, page, limit: 100 }, signal);
      machines.push(...next.data);
    }
    return machines;
  },

  // Máy và tình trạng đặt chỗ trong ca của đúng booking, lấy đủ mọi trang.
  async listForBooking(storeId: number, bookingId: number, signal?: AbortSignal): Promise<StoreMachine[]> {
    return machineService.listAll(storeId, signal, { booking_id: bookingId });
  },

  async getById(
    storeId: number,
    machineId: number,
    signal?: AbortSignal,
  ): Promise<StoreMachine> {
    const { data } = await axiosInstance.get<{ data: StoreMachine }>(
      `/stores/${storeId}/machines/${machineId}`,
      { signal },
    );
    return data.data;
  },

  async getUsageLogs(
    storeId: number,
    machineId: number,
    params: MachineUsageParams = {},
    signal?: AbortSignal,
  ): Promise<PaginatedMachineUsage> {
    const { data } = await axiosInstance.get<PaginatedMachineUsage>(
      `/stores/${storeId}/machines/${machineId}/usage-logs`,
      { params, signal },
    );
    return data;
  },
};
