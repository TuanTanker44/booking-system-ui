import { ArrowRight, ClipboardList } from "lucide-react";
import SectionCard from "../ui/SectionCard";
import StatusBadge from "../ui/StatusBadge";
import type { PendingOrder } from "../../../types/staff";

export default function PendingOrdersTable({ orders, message }: { orders: PendingOrder[]; message?: string }) {
  return (
    <SectionCard title="Đơn hàng cần xử lý" icon={<ClipboardList size={19} />}
      action={<a className="text-link" href="/staff/bookings">Xem tất cả <ArrowRight size={15} /></a>}
      className="orders-card">
      <div className="table-scroll">
        <table className="orders-table">
          <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Dịch vụ</th><th>Thời gian nhận</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {(message || orders.length === 0) && (
              <tr><td colSpan={6}>{message ?? "Không có đơn hàng cần xử lý."}</td></tr>
            )}
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="order-id">{order.bookingCode ?? order.id}</td><td>{order.customer}</td><td>{order.service}</td>
                <td>{order.pickupTime}</td><td><StatusBadge status={order.status} /></td>
                <td><a className="table-action" href={`/staff/bookings/${encodeURIComponent(order.id)}`}>Chi tiết</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
