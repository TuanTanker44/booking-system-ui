import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, Package, Plus, Search, SlidersHorizontal, Truck } from "lucide-react";
import { getErrorMessage } from "../../lib/error";
import { formatAddress } from "../../services/address";
import { BOOKING_STATUS_LABELS, BookingService, CANCELLABLE_STATUSES } from "../../services/booking";
import type { Address } from "../../types/address";
import type { Booking, BookingDetail, BookingStatus } from "../../types/booking";
import { PageHeading } from "./PageHeading";
import { formatMoney, formatPickupSlot, statusClass } from "./format";
import { useFetched } from "./useFetched";

type Page = "home" | "booking" | "orders" | "addresses" | "profile";

const TABS = ["Tất cả", "Đang xử lý", "Sẵn sàng giao", "Hoàn thành", "Đã hủy"] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUSES: Record<Exclude<Tab, "Tất cả">, BookingStatus[]> = {
  "Đang xử lý": ["pending_payment", "confirmed", "picked_up", "processing"],
  "Sẵn sàng giao": ["ready_for_delivery", "delivering"],
  "Hoàn thành": ["completed"],
  "Đã hủy": ["cancelled", "no_show"],
};

// Các mốc tiến trình. Đơn tự mang đến cửa hàng (in_store) bỏ qua bước lấy đồ / giao trả.
const FLOW_DELIVERY: { status: BookingStatus; title: string }[] = [
  { status: "pending_payment", title: "Đặt lịch thành công" },
  { status: "confirmed", title: "Cửa hàng xác nhận" },
  { status: "picked_up", title: "Đã lấy đồ" },
  { status: "processing", title: "Đang giặt & chăm sóc" },
  { status: "ready_for_delivery", title: "Sẵn sàng giao" },
  { status: "delivering", title: "Đang giao đến bạn" },
  { status: "completed", title: "Hoàn thành" },
];
const FLOW_IN_STORE = FLOW_DELIVERY.filter(step => ["pending_payment", "confirmed", "processing", "completed"].includes(step.status));

const bookingTotal = (booking: Booking) => booking.final_price ?? booking.estimated_price;

export function OrdersPage(props: {
  orders: Booking[]; total: number; status: "loading" | "ready" | "error"; reload: () => Promise<void>;
  search: string; setSearch: (value: string) => void;
  activeOrder: number | null; setActiveOrder: (id: number | null) => void;
  navigate: (page: Page) => void; addresses: Address[]; notify: (message: string) => void;
  // Giao diện thanh toán của đơn (nếu có), hiển thị ngay dưới panel theo dõi đơn
  renderPayment?: (orderId: number) => React.ReactNode;
}) {
  const { orders, total, status, reload, search, setSearch, activeOrder, setActiveOrder, navigate, addresses, notify, renderPayment } = props;
  const [tab, setTab] = useState<Tab>("Tất cả");

  if (activeOrder !== null) {
    return <OrderDetailView id={activeOrder} onBack={() => setActiveOrder(null)} navigate={navigate} addresses={addresses} notify={notify} onChanged={reload} payment={renderPayment?.(activeOrder)} />;
  }

  const keyword = search.trim().toLowerCase();
  const filtered = orders.filter(order =>
    (tab === "Tất cả" || TAB_STATUSES[tab].includes(order.status))
    && (!keyword || [order.booking_code, order.service_name, BOOKING_STATUS_LABELS[order.status]].some(value => value.toLowerCase().includes(keyword))));
  const count = (statuses: BookingStatus[]) => orders.filter(order => statuses.includes(order.status)).length;

  return <>
    <PageHeading eyebrow="QUẢN LÝ ĐƠN HÀNG" title="Đơn hàng của tôi" description="Theo dõi tình trạng giặt ủi và xem lại các đơn hàng trước đây." action={<button className="primary-button" onClick={() => navigate("booking")}><Plus size={17} /> Đặt lịch mới</button>} />
    <div className="order-stats"><div><span className="stat-icon stat-blue"><Package /></span><div><small>Tổng đơn hàng</small><strong>{total}</strong></div></div><div><span className="stat-icon stat-orange"><Clock3 /></span><div><small>Đang xử lý</small><strong>{count(TAB_STATUSES["Đang xử lý"])}</strong></div></div><div><span className="stat-icon stat-purple"><Truck /></span><div><small>Sẵn sàng giao</small><strong>{count(TAB_STATUSES["Sẵn sàng giao"])}</strong></div></div><div><span className="stat-icon stat-green"><CheckCircle2 /></span><div><small>Hoàn thành</small><strong>{count(TAB_STATUSES["Hoàn thành"])}</strong></div></div></div>
    <div className="panel orders-panel"><div className="orders-toolbar"><div className="filter-tabs">{TABS.map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div><div className="orders-search"><Search /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã đơn, dịch vụ..." /><button aria-label="Bộ lọc"><SlidersHorizontal size={16} /></button></div></div>
      <div className="table-wrap"><table><thead><tr><th>MÃ ĐƠN HÀNG</th><th>NGÀY ĐẶT</th><th>DỊCH VỤ / LẤY ĐỒ</th><th>TRẠNG THÁI</th><th>TỔNG TIỀN</th><th></th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><strong className="order-code">{item.booking_code}</strong></td><td>{new Date(item.created_at).toLocaleDateString("vi-VN")}</td><td><strong>{item.service_name}</strong><small className="table-subtitle">{formatPickupSlot(item.scheduled_pickup_start, item.scheduled_pickup_end)} · {item.in_store ? "Tại cửa hàng" : "Giao nhận tận nơi"}</small></td><td><span className={`status-pill ${statusClass(item.status)}`}><i />{BOOKING_STATUS_LABELS[item.status]}</span></td><td><strong>{formatMoney(bookingTotal(item))}</strong></td><td><button className="table-action" onClick={() => setActiveOrder(item.id)}>Chi tiết <ChevronRight size={14} /></button></td></tr>)}</tbody></table>
        {status === "loading" && <div className="empty-state"><Package /><strong>Đang tải đơn hàng...</strong></div>}
        {status === "error" && <div className="empty-state"><Package /><strong>Không thể tải đơn hàng</strong><button className="outline-button" onClick={() => void reload()}>Thử lại</button></div>}
        {status === "ready" && filtered.length === 0 && <div className="empty-state"><Package /><strong>Không tìm thấy đơn hàng</strong><p>Thử từ khóa khác hoặc chọn trạng thái khác.</p></div>}</div>
      <div className="table-footer"><span>Hiển thị {filtered.length} / {total} đơn hàng{orders.length < total ? ` (đã tải ${orders.length} đơn mới nhất)` : ""}</span><button className="text-link" onClick={() => setSearch("")}>Xóa tìm kiếm</button></div></div>
  </>;
}

function OrderDetailView({ id, onBack, navigate, addresses, notify, onChanged, payment }: { id: number; onBack: () => void; navigate: (page: Page) => void; addresses: Address[]; notify: (message: string) => void; onChanged: () => Promise<void>; payment?: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const fetched = useFetched(`order:${id}`, signal => BookingService.getById(id, signal), version);
  const order = fetched.data;

  const back = <button className="outline-button" onClick={onBack}>← Quay lại danh sách</button>;
  if (!order) {
    return <><PageHeading eyebrow="LỊCH SỬ ĐẶT HÀNG" title="Chi tiết đơn hàng" action={back} /><div className="panel"><div className="empty-state"><Package /><strong>{fetched.status === "error" ? fetched.error : "Đang tải đơn hàng..."}</strong></div></div></>;
  }

  const cancel = async () => {
    setBusy(true);
    try {
      const result = await BookingService.cancel(order.id, reason.trim() || undefined);
      notify(result.refund_percent > 0 ? `Đã hủy đơn, bạn được hoàn ${result.refund_percent}%.` : "Đã hủy đơn.");
      setCancelling(false);
      setReason("");
      setVersion(current => current + 1);
      await onChanged();
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Không thể hủy đơn. Vui lòng thử lại."));
    } finally {
      setBusy(false);
    }
  };

  return <>
    <PageHeading eyebrow="LỊCH SỬ ĐẶT HÀNG" title={`Đơn hàng #${order.booking_code}`} description="Theo dõi tiến trình và xem chi tiết đơn hàng của bạn." action={back} />
    <div className="order-detail-layout">
      <div className="order-main-column">
      <div className="panel order-tracking-panel"><div className="tracking-top"><div><span className={`status-pill ${statusClass(order.status)}`}><i />{BOOKING_STATUS_LABELS[order.status]}</span><h2>{trackingTitle(order.status)}</h2><p>{order.status === "cancelled" || order.status === "no_show" ? (order.cancellation_reason ?? "") : "Trạng thái được cập nhật khi cửa hàng xử lý đơn."}</p></div><div className="tracking-illustration"><Package /></div></div>
        {order.status !== "cancelled" && order.status !== "no_show" && <Timeline order={order} />}
      </div>
      {payment}
      </div>
      <div className="panel"><h2 className="panel-title-text">Thông tin đơn hàng</h2>
        <Row label="Mã đơn hàng" value={order.booking_code} />
        <Row label="Cửa hàng" value={`${order.store.name} — ${order.store.address}`} />
        <Row label="Dịch vụ" value={order.service_name} />
        <Row label={order.pricing_unit === "per_kg" ? "Khối lượng" : "Số món"} value={quantityText(order)} />
        <Row label="Lấy đồ" value={formatPickupSlot(order.scheduled_pickup_start, order.scheduled_pickup_end)} />
        <Row label="Hình thức" value={order.in_store ? "Tự mang đến cửa hàng" : "Cửa hàng đến lấy & giao tận nơi"} />
        {!order.in_store && <Row label="Địa chỉ" value={addressText(addresses, order.pickup_address_id)} />}
        {!order.in_store && order.delivery_address_id !== order.pickup_address_id && <Row label="Địa chỉ giao" value={addressText(addresses, order.delivery_address_id)} />}
        {order.special_instructions && <Row label="Ghi chú" value={order.special_instructions} />}
        {order.discount_amount > 0 && <Row label="Giảm giá" value={`-${formatMoney(order.discount_amount)}`} />}
        <div className="detail-row total-row"><span>{order.final_price !== null ? "Tổng tiền" : "Tổng tiền tạm tính"}</span><strong>{formatMoney(bookingTotal(order))}</strong></div>
        {CANCELLABLE_STATUSES.includes(order.status) && (cancelling
          ? <div className="cancel-box"><label className="field-label">Lý do hủy (không bắt buộc)<textarea rows={2} maxLength={255} value={reason} onChange={e => setReason(e.target.value)} /></label><div className="form-actions"><button className="outline-button" onClick={() => setCancelling(false)} disabled={busy}>Không hủy</button><button className="primary-button danger-button" onClick={() => void cancel()} disabled={busy}>{busy ? "Đang hủy..." : "Xác nhận hủy đơn"}</button></div></div>
          : <button className="outline-button full-button" onClick={() => setCancelling(true)}>Hủy đơn</button>)}
        <button className="primary-button full-button" onClick={() => navigate("booking")}>Đặt đơn mới <ArrowRight size={16} /></button>
      </div>
    </div>
  </>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>;
}

function Timeline({ order }: { order: BookingDetail }) {
  const flow = order.in_store ? FLOW_IN_STORE : FLOW_DELIVERY;
  const reached = FLOW_DELIVERY.findIndex(step => step.status === order.status);
  return <div className="tracking-timeline">{flow.map((step, index) => {
    const done = FLOW_DELIVERY.findIndex(item => item.status === step.status) <= reached;
    return <div className={`timeline-item ${done ? "done" : ""}`} key={step.status}><span className="timeline-marker">{done ? <CheckCircle2 size={13} /> : index + 1}</span><div><strong>{step.title}</strong><small>{step.status === order.status ? "Đang ở bước này" : done ? "Đã hoàn tất" : "Chờ xử lý"}</small></div></div>;
  })}</div>;
}

function trackingTitle(status: BookingStatus) {
  switch (status) {
    case "pending_payment": return "Đơn hàng đang chờ thanh toán";
    case "cancelled": return "Đơn hàng đã bị hủy";
    case "no_show": return "Bạn không đến lấy/giao đồ đúng hẹn";
    case "completed": return "Đơn hàng đã hoàn thành";
    default: return "Đơn hàng của bạn đang được xử lý";
  }
}

function quantityText(order: BookingDetail) {
  if (order.pricing_unit === "per_kg") {
    const estimated = order.estimated_weight_kg !== null ? `${order.estimated_weight_kg} kg (ước tính)` : "—";
    return order.actual_weight_kg !== null ? `${order.actual_weight_kg} kg (thực tế) · ${estimated}` : estimated;
  }
  return order.booking_items?.map(item => `${item.item_name} × ${item.quantity}`).join(", ") || "—";
}

function addressText(addresses: Address[], id: number | null) {
  const found = addresses.find(item => item.id === id);
  return found ? `${found.label}, ${formatAddress(found)}` : id === null ? "—" : `Địa chỉ #${id}`;
}
