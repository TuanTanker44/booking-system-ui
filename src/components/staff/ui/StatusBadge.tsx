import type { BookingStatus, MachineStatus } from "../../../types/staff";

type Props = { status: BookingStatus | MachineStatus };

export default function StatusBadge({ status }: Props) {
  const tone =
    status === "Đang giặt" || status === "Đang hoạt động" ? "green" :
    status === "Ngừng hoạt động" || status === "Đã hủy" || status === "Không đến" ? "red" :
    status === "Chờ lấy đồ" || status === "Bảo trì" || status === "Chờ thanh toán" ? "orange" :
    status === "Chờ giao" || status === "Sẵn sàng giao" ? "purple" :
    status === "Đang giao" ? "cyan" : "blue";

  return <span className={`status-badge status-badge--${tone}`}>{status}</span>;
}
