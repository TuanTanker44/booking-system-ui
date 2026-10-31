export type StoreOption = {
  id: string;
  name: string;
};

export type DashboardStat = {
  label: string;
  value: string | number;
  hint: string;
  tone: "blue" | "green" | "orange" | "purple" | "cyan" | "red";
  icon: "orders" | "washing" | "truck" | "check" | "machine" | "alert";
};

export type BookingStatus =
  | "Chờ thanh toán"
  | "Đã lấy đồ"
  | "Sẵn sàng giao"
  | "Hoàn thành"
  | "Đã hủy"
  | "Không đến"
  | "Đã xác nhận"
  | "Chờ lấy đồ"
  | "Đang giặt"
  | "Chờ giao"
  | "Đang giao";

export type PendingOrder = {
  id: string;
  bookingCode?: string;
  customer: string;
  service: string;
  pickupTime: string;
  status: BookingStatus;
};

export type MachineStatus = "Đang hoạt động" | "Sẵn sàng" | "Bảo trì" | "Ngừng hoạt động";

export type Machine = {
  id: string;
  name: string;
  status: MachineStatus;
  detail: string;
};
