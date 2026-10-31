import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplets,
  MoreHorizontal,
  PauseCircle,
  Power,
  Search,
  WashingMachine,
  Wrench,
  X,
} from "lucide-react";
import "./MachinePage.css";
import RefreshDataButton from "../../ui/RefreshDataButton";
import { useStaffFetched } from "../../../../hooks/useStaffFetched";
import { machineService } from "../../../../services/machine";

export interface MachineStore {
  id: number;
  name: string;
}

type MachineStatus = "active" | "idle" | "maintenance" | "inactive";

interface Machine {
  id: number;
  storeId: number;
  code: string;
  name: string;
  capacity: number;
  status: MachineStatus;
  operatingHours: string;
  description: string;
  lastMaintenance: string;
}

interface MachinesPageProps {
  selectedStore: MachineStore | null;
}

type StatusFilter = "all" | MachineStatus;

const STATUS_CONFIG: Record<
  MachineStatus,
  { label: string; icon: typeof Activity }
> = {
  idle: { label: "Sẵn sàng", icon: CheckCircle2 },
  active: {
    label: "Hoạt động",
    icon: Activity,
  },
  maintenance: {
    label: "Bảo trì",
    icon: Wrench,
  },
  inactive: {
    label: "Ngừng hoạt động",
    icon: Power,
  },
};

export default function MachinesPage({
  selectedStore,
}: MachinesPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [selectedMachineId, setSelectedMachineId] =
    useState<number | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  const machinesFetch = useStaffFetched(
    selectedStore ? `staff-machines:${selectedStore.id}` : null,
    (signal) => machineService.listAll(selectedStore!.id, signal),
    reloadToken,
  );
  const storeMachines = useMemo<Machine[]>(
    () => (machinesFetch.data ?? []).map((machine) => ({
      id: machine.id,
      storeId: machine.store_id,
      code: `#${machine.id}`,
      name: machine.name,
      capacity: machine.capacity_kg,
      status: machine.status === "running" ? "active" : machine.status === "offline" ? "inactive" : machine.status,
      operatingHours: "Chưa có dữ liệu",
      description: machine.current_usage ? `Đang xử lý đơn ${machine.current_usage.booking_code}` : "Chưa có đơn được gán",
      lastMaintenance: "Chưa có dữ liệu",
    })),
    [machinesFetch.data],
  );
  const filteredMachines = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return storeMachines.filter((machine) => {
      const matchesSearch =
        !keyword ||
        machine.code.toLowerCase().includes(keyword) ||
        machine.name.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        machine.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [storeMachines, search, statusFilter]);

  const selectedMachine =
    storeMachines.find(
      (machine) => machine.id === selectedMachineId,
    ) ?? null;

  const stats = useMemo(
    () => ({
      total: storeMachines.length,
      active: storeMachines.filter(
        (machine) => machine.status === "active",
      ).length,
      maintenance: storeMachines.filter(
        (machine) => machine.status === "maintenance",
      ).length,
      inactive: storeMachines.filter(
        (machine) => machine.status === "inactive",
      ).length,
    }),
    [storeMachines],
  );

  const usageFetch = useStaffFetched(
    selectedStore && selectedMachine ? `machine-usage:${selectedStore.id}:${selectedMachine.id}` : null,
    (signal) => machineService.getUsageLogs(selectedStore!.id, selectedMachineId!, { limit: 10 }, signal),
    reloadToken,
  );
  const machineUsage = (usageFetch.data?.data ?? []).map((usage) => ({
    id: usage.id,
    bookingCode: usage.booking_code,
    startedAt: new Date(usage.started_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    status: usage.ended_at ? "completed" : "processing",
  }));
  const loading = machinesFetch.status === "loading" || usageFetch.status === "loading";
  const ready = machinesFetch.status === "ready";

  if (!selectedStore) {
    return (
      <div className="machines-page">
        <div className="machines-empty-state">
          <WashingMachine size={44} />
          <h2>Chưa chọn cửa hàng</h2>
          <p>
            Vui lòng chọn cửa hàng để xem danh sách máy giặt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="machines-page">
      {/* Page heading */}
      <header className="machines-header">
        <div className="machines-header__icon">
          <WashingMachine size={28} />
        </div>

        <div className="machines-header__content">
          <h1>Quản lý máy giặt</h1>
          <p>
            Theo dõi và quản lý trạng thái máy giặt tại cửa hàng
          </p>
        </div>
        <RefreshDataButton loading={loading} onRefresh={() => setReloadToken((value) => value + 1)} />
      </header>
      {machinesFetch.status === "loading" && <p role="status">Đang tải danh sách máy...</p>}
      {machinesFetch.status === "error" && <p role="alert">{machinesFetch.error}</p>}

      {/* Current store */}
      <section className="machines-store-banner">
        <div className="machines-store-banner__icon">
          <Droplets size={25} />
        </div>

        <div className="machines-store-banner__info">
          <span>Cửa hàng đang làm việc</span>
          <strong>{selectedStore.name}</strong>
        </div>

        <div className="machines-store-banner__divider" />

        <div className="machines-store-banner__note">
          <Activity size={17} />
          <span>
            {ready ? `${stats.active} / ${stats.total}` : "—"} máy đang hoạt động
          </span>
        </div>

      </section>

      {/* Statistics */}
      <section className="machines-stats">
        <div className="machines-stat-card">
          <div className="machines-stat-card__icon machines-stat-card__icon--blue">
            <WashingMachine size={23} />
          </div>

          <div>
            <span>Tổng số máy</span>
            <strong>{ready ? stats.total : "—"}</strong>
          </div>
        </div>

        <div className="machines-stat-card">
          <div className="machines-stat-card__icon machines-stat-card__icon--green">
            <CheckCircle2 size={23} />
          </div>

          <div>
            <span>Đang hoạt động</span>
            <strong>{ready ? stats.active : "—"}</strong>
          </div>
        </div>

        <div className="machines-stat-card">
          <div className="machines-stat-card__icon machines-stat-card__icon--orange">
            <PauseCircle size={23} />
          </div>

          <div>
            <span>Đang bảo trì</span>
            <strong>{ready ? stats.maintenance : "—"}</strong>
          </div>
        </div>

        <div className="machines-stat-card">
          <div className="machines-stat-card__icon machines-stat-card__icon--gray">
            <Power size={23} />
          </div>

          <div>
            <span>Ngừng hoạt động</span>
            <strong>{ready ? stats.inactive : "—"}</strong>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="machines-workspace">
        <div className="machines-list-panel">
          <div className="machines-list-panel__header">
            <div>
              <h2>Danh sách máy</h2>
              <p>
                {ready ? filteredMachines.length : "—"} máy được tìm thấy
              </p>
            </div>

            <button
              type="button"
              className="machines-more-button"
              aria-label="Tùy chọn"
            >
              <MoreHorizontal size={22} />
            </button>
          </div>

          {/* Search */}
          <div className="machines-toolbar">
            <label className="machines-search">
              <Search size={19} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm theo mã máy..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}
            </label>
          </div>

          {/* Filters */}
          <div className="machines-filters">
            {(
              [
                ["all", "Tất cả"],
                ["active", "Hoạt động"],
                ["idle", "Sẵn sàng"],
                ["maintenance", "Bảo trì"],
                ["inactive", "Ngừng hoạt động"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`machines-filter ${
                  statusFilter === value ? "is-active" : ""
                }`}
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Machine cards */}
          {!ready ? null : filteredMachines.length > 0 ? (
            <div className="machines-grid">
              {filteredMachines.map((machine) => {
                const config = STATUS_CONFIG[machine.status];
                const StatusIcon = config.icon;
                const isSelected =
                  selectedMachineId === machine.id;

                return (
                  <button
                    type="button"
                    key={machine.id}
                    className={`machine-card ${
                      isSelected ? "is-selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedMachineId(machine.id)
                    }
                  >
                    <div className="machine-card__top">
                      <span
                        className={`machine-status machine-status--${machine.status}`}
                      >
                        <StatusIcon size={13} />
                        {config.label}
                      </span>

                      <ChevronRight
                        className="machine-card__arrow"
                        size={17}
                      />
                    </div>

                    <div className="machine-card__illustration">
                      <div className="machine-card__washer">
                        <WashingMachine size={47} strokeWidth={1.3} />
                      </div>
                    </div>

                    <div className="machine-card__info">
                      <strong>{machine.code}</strong>
                      <span>{machine.name}</span>
                    </div>

                    <div className="machine-card__capacity">
                      <Droplets size={14} />
                      Công suất {machine.capacity} kg
                    </div>

                    <div className="machine-card__footer">
                      <span>Xem chi tiết</span>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="machines-no-results">
              <Search size={30} />
              <strong>Không tìm thấy máy giặt</strong>
              <p>
                Thử thay đổi từ khóa hoặc bộ lọc trạng thái.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <aside className="machines-detail-panel">
          {selectedMachine ? (
            <>
              <div className="machines-detail-panel__header">
                <div>
                  <h2>Chi tiết máy</h2>
                  <span>{selectedMachine.code}</span>
                </div>

                <button
                  type="button"
                  className="machines-detail-close"
                  onClick={() => setSelectedMachineId(null)}
                  aria-label="Đóng chi tiết"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="machines-detail-overview">
                <div className="machines-detail-overview__icon">
                  <WashingMachine size={65} strokeWidth={1.1} />
                </div>

                <div className="machines-detail-overview__content">
                  <span
                    className={`machine-status machine-status--${selectedMachine.status}`}
                  >
                    <span className="machine-status__dot" />
                    {STATUS_CONFIG[selectedMachine.status].label}
                  </span>

                  <h3>{selectedMachine.code}</h3>
                  <p>{selectedMachine.name}</p>
                </div>
              </div>

              <div className="machines-detail-description">
                {selectedMachine.description}
              </div>

              <div className="machines-detail-properties">
                <div>
                  <Droplets size={18} />
                  <span>Công suất</span>
                  <strong>{selectedMachine.capacity} kg</strong>
                </div>

                <div>
                  <Activity size={18} />
                  <span>Trạng thái</span>
                  <strong
                    className={`machines-detail-status--${selectedMachine.status}`}
                  >
                    {STATUS_CONFIG[selectedMachine.status].label}
                  </strong>
                </div>

                <div>
                  <Clock3 size={18} />
                  <span>Giờ hoạt động</span>
                  <strong>{selectedMachine.operatingHours}</strong>
                </div>

                <div>
                  <Wrench size={18} />
                  <span>Bảo trì gần nhất</span>
                  <strong>{selectedMachine.lastMaintenance}</strong>
                </div>
              </div>

              <div className="machines-usage">
                <div className="machines-usage__header">
                  <div>
                    <h3>Lịch sử sử dụng</h3>
                    <p>Các đơn hàng gần đây</p>
                  </div>

                  <CalendarDays size={19} />
                </div>

                {usageFetch.status === "loading" ? <p role="status">Đang tải lịch sử sử dụng...</p>
                  : usageFetch.status === "error" ? <p role="alert">{usageFetch.error}</p>
                  : machineUsage.length > 0 ? (
                  <div className="machines-usage__list">
                    {machineUsage.map((usage) => (
                      <div
                        className="machines-usage-item"
                        key={usage.id}
                      >
                        <div className="machines-usage-item__icon">
                          <WashingMachine size={17} />
                        </div>

                        <div className="machines-usage-item__info">
                          <strong>{usage.bookingCode}</strong>
                          <span>{usage.startedAt}</span>
                        </div>

                        <span
                          className={`machines-usage-item__status ${
                            usage.status === "completed"
                              ? "is-completed"
                              : "is-processing"
                          }`}
                        >
                          {usage.status === "completed"
                            ? "Hoàn thành"
                            : "Đang xử lý"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="machines-usage-empty">
                    Chưa có lịch sử sử dụng cho máy này.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="machines-detail-placeholder">
              <div className="machines-detail-placeholder__icon">
                <WashingMachine size={38} />
              </div>

              <h3>Chọn một máy giặt</h3>

              <p>
                Chọn máy trong danh sách để xem công suất,
                trạng thái và lịch sử sử dụng.
              </p>

              <div className="machines-detail-placeholder__hint">
                <Activity size={16} />
                {stats.total} máy tại cửa hàng này
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
