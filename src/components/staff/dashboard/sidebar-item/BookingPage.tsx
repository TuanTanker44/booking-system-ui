import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  ShoppingBag,
  Clock3,
  CheckCircle2,
  Truck,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  SlidersHorizontal,
  UserPlus,
  X,
} from "lucide-react";
import "./BookingPage.css";
import RefreshDataButton from "../../ui/RefreshDataButton";

import type { BookingStatus } from "../../../../types/booking";
import { useStaffFetched } from "../../../../hooks/useStaffFetched";
import { staffService } from "../../../../services/staff";
import { machineService } from "../../../../services/machine";
import { useStoreStore } from "../../../../stores/store";
import BookingAssignDialog from "./BookingAssignDialog";

type Booking = {
  id: number;
  storeId: string;
  code: string;
  customerName: string;
  customerPhone: string;
  services: string[];
  totalAmount: number;
  createdAt: string;
  pickupTime: string;
  status: BookingStatus;
  inStore: boolean;
};

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  pending_payment: {
    label: "Chờ thanh toán",
    className: "pending-payment",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "confirmed",
  },
  picked_up: {
    label: "Đã nhận đồ",
    className: "picked-up",
  },
  processing: {
    label: "Đang xử lý",
    className: "processing",
  },
  ready_for_delivery: {
    label: "Chờ giao đồ",
    className: "ready-delivery",
  },
  delivering: {
    label: "Đang giao",
    className: "delivering",
  },
  completed: {
    label: "Hoàn thành",
    className: "completed",
  },
  cancelled: {
    label: "Đã hủy",
    className: "cancelled",
  },
  no_show: {
    label: "Khách không có mặt",
    className: "no-show",
  },
};

const PAGE_SIZE = 6;

function dateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export default function BookingPage({
  selectedStoreId,
}: {
  selectedStoreId: string;
}) {
  const [reloadToken, setReloadToken] = useState(0);
  const bookingsFetch = useStaffFetched(
    selectedStoreId ? `staff-bookings:${selectedStoreId}` : null,
    (signal) => staffService.getStoreBookingsWithCustomers(Number(selectedStoreId), signal),
    reloadToken,
  );
  const ready = bookingsFetch.status === "ready";
  const storeBookings = useMemo<Booking[]>(
    () => (bookingsFetch.data ?? []).map((booking) => ({
      id: booking.id,
      storeId: String(booking.store_id),
      code: booking.booking_code,
      customerName: booking.customer?.full_name ?? "Chưa có thông tin",
      customerPhone: booking.customer?.phone ?? "",
      services: [booking.service_name],
      totalAmount: booking.final_price ?? booking.estimated_price,
      createdAt: booking.created_at,
      pickupTime: booking.scheduled_pickup_start,
      status: booking.status,
      inStore: booking.in_store,
    })),
    [bookingsFetch.data],
  );
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
    "all",
  );
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [detailReloadToken, setDetailReloadToken] = useState(0);
  const [assignBookingId, setAssignBookingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string } | null>(null);
  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notification]);
  const assignBooking = storeBookings.find((booking) => booking.id === assignBookingId);
  const selectedBooking = storeBookings.find((booking) => booking.id === selectedBookingId);
  const detailFetch = useStaffFetched(
    selectedBooking ? `staff-booking:${selectedStoreId}:${selectedBooking.id}` : null,
    (signal) => staffService.getBookingDetail(selectedBookingId!, signal),
    detailReloadToken,
  );
  const detail = detailFetch.data;
  const machinesFetch = useStaffFetched(
    selectedBooking ? `staff-booking-machines:${selectedStoreId}:${selectedBooking.id}` : null,
    (signal) => machineService.listForBooking(Number(selectedStoreId), selectedBookingId!, signal),
  );
  const assignedMachines = machinesFetch.data?.filter((machine) => machine.assigned_to_booking === true);
  const assignedDelivery = detail?.delivery_trips?.find((trip) => trip.trip_type === "delivery");
  const handleAssignmentChanged = (message: string) => {
    const cache = useStoreStore.getState();
    if (cache.currentStoreId !== Number(selectedStoreId) || assignBookingId === null) return;
    setNotification({ message });
    cache.invalidateQueries(`machine-usage:${selectedStoreId}:`);
    void cache.loadQuery(`staff-machines:${selectedStoreId}`, (signal) => machineService.listAll(Number(selectedStoreId), signal), true);
    void cache.loadQuery(`staff-booking-machines:${selectedStoreId}:${assignBookingId}`, (signal) => machineService.listForBooking(Number(selectedStoreId), assignBookingId, signal), true);
    void cache.loadQuery(`staff-booking:${selectedStoreId}:${assignBookingId}`, (signal) => staffService.getBookingDetail(assignBookingId, signal), true);
  };
  const bookingDetail = selectedBooking && (detail ? {
    ...selectedBooking,
    code: detail.booking_code,
    customerName: detail.users_bookings_customer_idTousers.full_name,
    customerPhone: detail.users_bookings_customer_idTousers.phone ?? "",
    services: [detail.service_name],
    totalAmount: Number(detail.final_price ?? detail.estimated_price),
    createdAt: detail.created_at,
    pickupTime: detail.scheduled_pickup_start,
    status: detail.status,
  } : selectedBooking);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return storeBookings.filter((booking) => {
      const matchesKeyword =
        !normalizedKeyword ||
        booking.code.toLowerCase().includes(normalizedKeyword) ||
        booking.customerName.toLowerCase().includes(normalizedKeyword) ||
        booking.customerPhone.includes(normalizedKeyword);

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      const matchesDate =
        !dateFilter || dateKey(booking.createdAt) === dateFilter;

      return matchesKeyword && matchesStatus && matchesDate;
    });
  }, [storeBookings, keyword, statusFilter, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const displayedBookings = filteredBookings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const countByStatus = (status: BookingStatus) =>
    storeBookings.filter((booking) => booking.status === status).length;

  const resetFilters = () => {
    setKeyword("");
    setStatusFilter("all");
    setDateFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="booking-page">
      {notification && <div className="booking-assignment-notification" role="status" aria-live="polite">
        <CheckCircle2 size={20} aria-hidden="true" />
        <span>{notification.message}</span>
        <button type="button" aria-label="Đóng thông báo" onClick={() => setNotification(null)}><X size={16} /></button>
      </div>}
      <div className="booking-page__heading">
        <div>
          <span className="booking-page__eyebrow">QUẢN LÝ VẬN HÀNH</span>
          <h1>Đơn hàng</h1>
          <p>Quản lý và theo dõi các đơn giặt tại cửa hàng.</p>
        </div>
        <RefreshDataButton
          loading={bookingsFetch.status === "loading"}
          onRefresh={() => { setSelectedBookingId(null); setReloadToken((value) => value + 1); }}
        />

      </div>

      <section className="booking-stats">
        <StatCard
          icon={<ShoppingBag size={20} />}
          label="Tổng đơn hàng"
          value={ready ? storeBookings.length : "—"}
          variant="blue"
        />

        <StatCard
          icon={<Clock3 size={20} />}
          label="Chờ thanh toán"
          value={ready ? countByStatus("pending_payment") : "—"}
          variant="orange"
        />

        <StatCard
          icon={<RefreshCw size={20} />}
          label="Đang xử lý"
          value={ready ? countByStatus("processing") : "—"}
          variant="purple"
        />

        <StatCard
          icon={<Truck size={20} />}
          label="Đang giao"
          value={ready ? countByStatus("delivering") : "—"}
          variant="green"
        />

        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Hoàn thành"
          value={ready ? countByStatus("completed") : "—"}
          variant="teal"
        />
      </section>

      <section className="booking-list-card">
        <div className="booking-list-card__heading">
          <div>
            <h2>Danh sách đơn hàng</h2>
            {ready && <p>
              Tìm thấy <strong>{filteredBookings.length}</strong> đơn hàng
            </p>}
          </div>
          <button
            type="button"
            className="booking-page__refresh"
            onClick={resetFilters}
          >
            <RefreshCw size={16} />
            Đặt lại bộ lọc
          </button>
        </div>

        <div className="booking-filters">
          <label className="booking-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Tìm mã đơn, tên hoặc số điện thoại..."
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setCurrentPage(1);
              }}
            />
          </label>

          <label className="booking-filter-select">
            <SlidersHorizontal size={16} />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | BookingStatus);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>

          <label className="booking-filter-date">
            <CalendarDays size={16} />
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => {
                setDateFilter(event.target.value);
                setCurrentPage(1);
              }}
              aria-label="Lọc theo ngày tạo đơn"
            />
          </label>
        </div>

        <div className="booking-table-wrapper">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Thời gian nhận</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {displayedBookings.map((booking) => {
                const status = STATUS_CONFIG[booking.status];

                return (
                  <tr key={booking.id}>
                    <td>
                      <strong className="booking-code">
                        #{booking.code}
                      </strong>
                      <small className="booking-created">
                        {formatDate(booking.createdAt)}
                      </small>
                    </td>

                    <td>
                      <div className="booking-customer">
                        <strong>{booking.customerName}</strong>
                        <span>{booking.customerPhone || "—"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="booking-services">
                        {booking.services.map((service) => (
                          <span key={service}>{service}</span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span className="booking-pickup-time">
                        {formatDate(booking.pickupTime)}
                      </span>
                    </td>

                    <td>
                      <strong className="booking-amount">
                        {formatCurrency(booking.totalAmount)}
                      </strong>
                    </td>

                    <td>
                      <span className={`booking-status ${status.className}`}>
                        {status.label}
                      </span>
                    </td>

                    <td>
                      <div className="booking-row-actions">
                      <button
                        type="button"
                        className="booking-view-button"
                        title={`Xem đơn ${booking.code}`}
                        aria-label={`Xem đơn ${booking.code}`}
                        onClick={() => setSelectedBookingId(booking.id)}
                      >
                        <Eye size={17} />
                      </button>
                      {(booking.status === "confirmed" || booking.status === "ready_for_delivery") && <button type="button" className="booking-assign-button" aria-label={`Phân công đơn ${booking.code}`}
                        onClick={() => { setSelectedBookingId(null); setAssignBookingId(booking.id); }}>
                        <UserPlus size={16} /> Phân công
                      </button>}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!ready && (
                <tr><td colSpan={7}>
                  <div className="booking-empty" role={bookingsFetch.status === "error" ? "alert" : "status"}>
                    <p>{bookingsFetch.status === "error" ? bookingsFetch.error : "Đang tải danh sách đơn hàng..."}</p>
                    {bookingsFetch.status === "error" && (
                      <button type="button" onClick={() => setReloadToken((value) => value + 1)}>Thử lại</button>
                    )}
                  </div>
                </td></tr>
              )}
              {ready && displayedBookings.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="booking-empty">
                      <PackageCheck size={32} />
                      <strong>Không tìm thấy đơn hàng</strong>
                      <p>Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                      <button type="button" onClick={resetFilters}>
                        Xóa bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="booking-pagination">
          <span>
            {!ready ? "—" : filteredBookings.length === 0
              ? "Không có kết quả"
              : `Hiển thị ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                  safePage * PAGE_SIZE,
                  filteredBookings.length,
                )} trong ${filteredBookings.length} đơn`}
          </span>

          <div className="booking-pagination__buttons">
            <button
              type="button"
              aria-label="Trang trước"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(safePage - 1)}
            >
              <ChevronLeft size={17} />
            </button>

            <span>
              {safePage} / {totalPages}
            </span>

            <button
              type="button"
              aria-label="Trang sau"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {assignBooking && <BookingAssignDialog
        key={`${selectedStoreId}:${assignBooking.id}`}
        storeId={Number(selectedStoreId)} bookingId={assignBooking.id} bookingCode={assignBooking.code}
        onClose={() => setAssignBookingId(null)} onChanged={handleAssignmentChanged}
      />}
      {bookingDetail && (
        <div
          className="booking-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedBookingId(null);
            }
          }}
        >
          <section
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
          >
            <div className="booking-modal__heading">
              <div>
                <span className="booking-page__eyebrow">
                  CHI TIẾT ĐƠN HÀNG
                </span>
                <h2 id="booking-modal-title">
                  #{bookingDetail.code}
                </h2>
              </div>

              <button
                type="button"
                className="booking-modal__close"
                onClick={() => setSelectedBookingId(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="booking-modal__body">
              {detailFetch.status === "loading" && <p role="status">Đang tải chi tiết đơn hàng...</p>}
              {detailFetch.status === "error" && (
                <div role="alert">
                  <p>{detailFetch.error}</p>
                  <button type="button" className="booking-page__refresh" onClick={() => setDetailReloadToken((value) => value + 1)}>Thử lại</button>
                </div>
              )}
              <div className="booking-modal__row">
                <span>Khách hàng</span>
                <strong>{bookingDetail.customerName}</strong>
              </div>

              <div className="booking-modal__row">
                <span>Số điện thoại</span>
                <strong>{bookingDetail.customerPhone || "—"}</strong>
              </div>

              <div className="booking-modal__row">
                <span>Ngày tạo đơn</span>
                <strong>{formatDate(bookingDetail.createdAt)}</strong>
              </div>

              <div className="booking-modal__row">
                <span>Thời gian nhận đồ</span>
                <strong>{formatDate(bookingDetail.pickupTime)}</strong>
              </div>

              <div className="booking-modal__row">
                <span>Trạng thái</span>
                <span
                  className={`booking-status ${
                    STATUS_CONFIG[bookingDetail.status].className
                  }`}
                >
                  {STATUS_CONFIG[bookingDetail.status].label}
                </span>
              </div>

              <div className="booking-modal__row">
                <span>Máy được gán</span>
                <strong>{machinesFetch.status === "loading" ? "Đang tải..."
                  : machinesFetch.status === "error" ? "Không thể tải thông tin máy"
                  : assignedMachines?.length ? assignedMachines.map((machine) => machine.name).join(", ") : "Chưa gán máy"}</strong>
              </div>
              <div className="booking-modal__row">
                <span>Shipper được gán</span>
                <strong>{detailFetch.status === "loading" ? "Đang tải..." : detailFetch.status === "error" ? "Không thể tải thông tin shipper"
                  : detail?.in_store ? "Không áp dụng" : detail?.delivery_trips === undefined ? "Chưa có thông tin"
                  : assignedDelivery?.shipper ? `${assignedDelivery.shipper.full_name}${assignedDelivery.shipper.phone ? ` · ${assignedDelivery.shipper.phone}` : ""}`
                  : assignedDelivery?.shipper_id ? `Shipper #${assignedDelivery.shipper_id}` : "Chưa gán shipper"}</strong>
              </div>

              <div className="booking-modal__services">
                <strong>Dịch vụ</strong>
                {bookingDetail.services.map((service) => (
                  <span key={service}>{service}</span>
                ))}
              </div>

              <div className="booking-modal__total">
                <span>Tổng tiền</span>
                <strong>
                  {formatCurrency(bookingDetail.totalAmount)}
                </strong>
              </div>
            </div>

            <div className="booking-modal__footer">
              <button
                type="button"
                className="booking-page__refresh"
                onClick={() => setSelectedBookingId(null)}
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  variant: "blue" | "orange" | "purple" | "green" | "teal";
}) {
  return (
    <article className="booking-stat-card">
      <span className={`booking-stat-card__icon ${variant}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
