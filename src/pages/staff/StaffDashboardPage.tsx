import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StaffHeader from "../../components/staff/layout/StaffHeader";
import WelcomeBanner from "../../components/staff/dashboard/WelcomeBanner";
import DashboardStats from "../../components/staff/dashboard/DashboardStats";
import PendingOrdersTable from "../../components/staff/dashboard/PendingOrdersTable";
import RecentActivities from "../../components/staff/dashboard/RecentActivities";
import OrderStatisticsChart from "../../components/staff/dashboard/OrderStatisticsChart";
import MachineStatusGrid from "../../components/staff/dashboard/MachineStatusGrid";
import BookingPage from "../../components/staff/dashboard/sidebar-item/BookingPage";
import SchedulePage from "../../components/staff/dashboard/sidebar-item/SchedulePage";
import MachinePage from "../../components/staff/dashboard/sidebar-item/MachinePage";
import ServicePage from "../../components/staff/dashboard/sidebar-item/ServicePage";
import type { DashboardStat, Machine, PendingOrder, StoreOption } from "../../types/staff";
import './StaffDashboardPage.css'
import StaffSidebar from "../../components/staff/layout/StaffSidebar";
import { useUserStore } from "../../stores/user";
import { userService } from "../../services/user";
import { useStaffFetched } from "../../hooks/useStaffFetched";
import { useStoreStore } from "../../stores/store";
import { staffService } from "../../services/staff";
import { machineService } from "../../services/machine";
import { ACTIVE_STATUSES, BOOKING_STATUS_LABELS } from "../../services/booking";
import { summarizeStoreBookings } from "../../utils/staff-dashboard";
import RefreshDataButton from "../../components/staff/ui/RefreshDataButton";

const pickupFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh",
});

const machineStatusLabels = {
  running: "Đang hoạt động",
  idle: "Sẵn sàng",
  maintenance: "Bảo trì",
  offline: "Ngừng hoạt động",
} as const;

export function StaffDashboardPage() {
  const storeList = useStoreStore((state) => state.stores);
  const selectedStore = useStoreStore((state) => state.currentStore);
  const setStores = useStoreStore((state) => state.setStores);
  const selectStore = useStoreStore((state) => state.selectStore);
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection = location.pathname === "/staff/bookings"
    ? "bookings"
    : location.pathname === "/staff/dashboard"
      ? "dashboard"
      : undefined;
  const showSchedule = location.pathname === "/staff/schedules";
  const showMachines = location.pathname === "/staff/machines";
  const showServices = location.pathname === "/staff/services";
  const storesFetch = useStaffFetched(
    "working-stores",
    (signal) => userService.getWorkingStore(signal),
  );
  useEffect(() => {
    if (storesFetch.data) {
      setStores(storesFetch.data.map((store) => ({ id: Number(store.id), name: store.name })));
    }
  }, [storesFetch.data, setStores]);
  const stores: StoreOption[] = storeList.map((store) => ({ id: String(store.id), name: store.name }));
  const selectedStoreId = selectedStore ? String(selectedStore.id) : "";
  const user = useUserStore((state) => state.user);
  const showBookings = activeSection === "bookings";
  const handleSectionChange = (section: "dashboard" | "bookings") => {
    navigate(section === "bookings" ? "/staff/bookings" : "/staff/dashboard");
  };

  const [reloadToken, setReloadToken] = useState(0);
  // Không tải dữ liệu tổng quan khi đang ở tab đơn hàng, máy hoặc lịch làm việc.
  const showOverview = !showBookings && !showMachines && !showSchedule && !showServices;
  const bookingsFetch = useStaffFetched(
    selectedStoreId && showOverview ? `staff-bookings:${selectedStoreId}` : null,
    (signal) => staffService.getStoreBookingsWithCustomers(Number(selectedStoreId), signal),
    reloadToken,
  );
  const machinesFetch = useStaffFetched(
    selectedStoreId && showOverview ? `staff-machines:${selectedStoreId}` : null,
    (signal) => machineService.listAll(Number(selectedStoreId), signal),
    reloadToken,
  );
  const summary = useMemo(
    () => bookingsFetch.data ? summarizeStoreBookings(bookingsFetch.data) : undefined,
    [bookingsFetch.data],
  );
  const counts = summary?.counts;
  const machineRecords = machinesFetch.data;
  const stats: DashboardStat[] = [
    { label: "Đơn chờ xử lý", value: counts ? counts.confirmed + counts.picked_up : "—", hint: "Đã xác nhận / đã lấy đồ", tone: "blue", icon: "orders" },
    { label: "Đang giặt", value: counts?.processing ?? "—", hint: "Đang xử lý", tone: "green", icon: "washing" },
    { label: "Chờ giao hàng", value: counts?.ready_for_delivery ?? "—", hint: "Chờ bàn giao", tone: "orange", icon: "truck" },
    { label: "Hoàn thành hôm nay", value: "—", hint: "Chưa có dữ liệu thống kê theo ngày", tone: "purple", icon: "check" },
    { label: "Máy đang hoạt động", value: machineRecords ? `${machineRecords.filter((machine) => machine.status === "running").length} / ${machineRecords.length}` : "—", hint: "Công suất sử dụng", tone: "cyan", icon: "machine" },
    { label: "Máy cần kiểm tra", value: machineRecords ? machineRecords.filter((machine) => machine.status === "maintenance" || machine.status === "offline").length : "—", hint: "Bảo trì / ngừng hoạt động", tone: "red", icon: "alert" },
  ];
  const orders: PendingOrder[] = (bookingsFetch.data ?? []).filter((booking) => ACTIVE_STATUSES.includes(booking.status)).slice(0, 5).map((booking) => ({
    id: String(booking.id),
    bookingCode: booking.booking_code,
    customer: booking.customer?.full_name ?? "Chưa có thông tin",
    service: booking.service_name,
    pickupTime: pickupFormatter.format(new Date(booking.scheduled_pickup_start)),
    status: BOOKING_STATUS_LABELS[booking.status],
  }));
  const machines: Machine[] = (machineRecords ?? []).map((machine) => ({
    id: String(machine.id),
    name: machine.name,
    status: machineStatusLabels[machine.status],
    detail: machine.current_usage
      ? `Đơn ${machine.current_usage.booking_code}`
      : machine.status === "idle" ? `Sức chứa ${machine.capacity_kg} kg`
      : machine.status === "maintenance" ? "Đang bảo trì"
      : machine.status === "offline" ? "Ngừng hoạt động" : "Đang vận hành",
  }));
  const loading = [bookingsFetch, machinesFetch].some((fetch) => fetch.status === "loading");
  const hasError = [bookingsFetch, machinesFetch].some((fetch) => fetch.status === "error");

  return (
    <div className="staff-app-shell">
  <StaffSidebar
    activeSection={activeSection}
    onSectionChange={handleSectionChange}
  />

  <main className="staff-main">
    <div className="staff-dashboard">
      <StaffHeader
        stores={stores}
        selectedStoreId={selectedStoreId}
        onStoreChange={(id) => selectStore(Number(id))}
      />

      <div
        className={
          showBookings
            ? "staff-dashboard__booking-content"
            : "staff-dashboard__content"
        }
      >
        {storesFetch.status === "loading" ? (
          <p>Đang tải cửa hàng được phân công...</p>
        ) : storesFetch.status === "error" ? (
          <div role="alert">
            <p>{storesFetch.error}</p>
            <button type="button" onClick={() => {
              void useStoreStore.getState().loadQuery("working-stores", (signal) => userService.getWorkingStore(signal), true);
            }}>Thử lại</button>
          </div>
        ) : stores.length === 0 ? (
          <p>Không tìm thấy cửa hàng được phân công cho tài khoản này.</p>
        ) : showBookings ? (
          <BookingPage key={selectedStoreId} selectedStoreId={selectedStoreId} />
        ) : showServices ? (
          <ServicePage
            key={selectedStoreId}
            selectedStore={selectedStore ? { id: Number(selectedStore.id), name: selectedStore.name } : null}
          />
        ) : showMachines ? (
          <MachinePage
            key={selectedStoreId}
            selectedStore={
              selectedStore
                ? { id: Number(selectedStore.id), name: selectedStore.name }
                : null
            }
          />
        ) : showSchedule ? (
          <SchedulePage
            key={selectedStoreId}
            selectedStore={
              selectedStore
                ? { id: Number(selectedStore.id), name: selectedStore.name }
                : null
            }
          />
        ) : (
          <>
            <div className="dashboard-overview-header">
              <WelcomeBanner staffName={user?.fullName || 'Nhân viên'} storeName={selectedStore?.name ?? ""}/>
              <RefreshDataButton loading={loading} onRefresh={() => setReloadToken((value) => value + 1)} />
            </div>
            {loading && <p role="status">Đang tải dữ liệu cửa hàng...</p>}
            {hasError && (
              <div className="dashboard-fetch-error" role="alert">
                {bookingsFetch.error && <p>Thống kê đơn hàng: {bookingsFetch.error}</p>}
                {machinesFetch.error && <p>Trạng thái máy: {machinesFetch.error}</p>}
                <button type="button" onClick={() => setReloadToken((value) => value + 1)}>Thử lại</button>
              </div>
            )}
            <DashboardStats stats={stats} />
            <div className="dashboard-grid dashboard-grid--primary">
              <PendingOrdersTable
                orders={orders}
                message={bookingsFetch.status === "loading" ? "Đang tải đơn hàng..." : bookingsFetch.status === "error" ? "Không thể tải danh sách đơn hàng." : undefined}
              />
              <RecentActivities items={[]} />
            </div>
            <div className="dashboard-grid dashboard-grid--secondary">
              <OrderStatisticsChart
                data={summary?.chartData ?? []}
                message={bookingsFetch.status === "loading" ? "Đang tải thống kê đơn hàng..." : bookingsFetch.status === "error" ? "Không thể tải thống kê đơn hàng." : undefined}
              />
              <MachineStatusGrid
                machines={machines}
                message={machinesFetch.status === "loading" ? "Đang tải máy..." : machinesFetch.status === "error" ? "Không thể tải danh sách máy." : undefined}
              />
            </div>
          </>
        )}
      </div>
    </div>
  </main>
</div>
  );
}
