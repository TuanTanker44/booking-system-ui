import { useMemo, useState } from "react";
import {
  Clock3,
  Droplets,
  Package,
  Search,
  WashingMachine,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  Filter,
} from "lucide-react";

import { useStaffFetched } from "../../../../hooks/useStaffFetched";
import { getManageableStoreServices } from "../../../../services/laundry-service";
import "./ServicePage.css";
import RefreshDataButton from "../../ui/RefreshDataButton";

interface ServiceStore {
  id: number;
  name: string;
}

interface ServicesPageProps {
  selectedStore: ServiceStore | null;
}

type ServiceStatusFilter = "all" | "active" | "inactive";
type PricingUnitFilter = "all" | "per_kg" | "per_item";

function formatPrice(price: number | string): string {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return "Chưa cập nhật";
  }

  return `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
}

function formatPricingUnit(unit: string): string {
  switch (unit) {
    case "per_kg":
      return "Theo kg";
    case "per_item":
      return "Theo sản phẩm";
    default:
      return unit;
  }
}

function formatTurnaround(hours: number | null): string {
  if (hours === null || hours === undefined || hours <= 0) {
    return "Chưa xác định";
  }

  if (hours < 24) {
    return `${hours} giờ`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days} ngày`;
  }

  return `${days} ngày ${remainingHours} giờ`;
}

export default function ServicePage({
  selectedStore,
}: ServicesPageProps) {
  const [reloadToken, setReloadToken] = useState(0);
  const servicesFetch = useStaffFetched(
    selectedStore ? `staff-services:${selectedStore.id}` : null,
    (signal) => getManageableStoreServices(selectedStore!.id, signal),
    reloadToken,
  );
  const services = useMemo(() => servicesFetch.data ?? [], [servicesFetch.data]);
  const isLoading = servicesFetch.status === "loading";
  const ready = servicesFetch.status === "ready";
  const error = servicesFetch.error;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ServiceStatusFilter>("all");
  const [pricingUnitFilter, setPricingUnitFilter] =
    useState<PricingUnitFilter>("all");

  const activeCount = services.filter(
    (service) => service.status === "active",
  ).length;

  const inactiveCount = services.filter(
    (service) => service.status !== "active",
  ).length;

  const filteredServices = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !keyword ||
        service.name.toLowerCase().includes(keyword) ||
        (service.description ?? "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? service.status === "active"
          : service.status !== "active");

      const matchesPricingUnit =
        pricingUnitFilter === "all" ||
        service.pricing_unit === pricingUnitFilter;

      return matchesSearch && matchesStatus && matchesPricingUnit;
    });
  }, [services, searchTerm, statusFilter, pricingUnitFilter]);

  function handleRetry() {
    setReloadToken((value) => value + 1);
  }

  if (!selectedStore) {
    return (
      <div className="staff-services-page">
        <div className="ss-empty-state">
          <div className="ss-empty-icon">
            <WashingMachine size={30} />
          </div>
          <h2>Chưa chọn cửa hàng</h2>
          <p>Vui lòng chọn cửa hàng để xem danh sách dịch vụ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-services-page">
      <header className="ss-page-header">
        <div className="ss-heading">
          <div className="ss-heading-icon">
            <Droplets size={25} />
          </div>

          <div>
            <div className="ss-eyebrow">QUẢN LÝ CỬA HÀNG</div>
            <h1>Dịch vụ giặt ủi</h1>
            <p>
              Danh sách dịch vụ hiện có tại{" "}
              <strong>{selectedStore.name}</strong>
            </p>
          </div>
        </div>

        <RefreshDataButton loading={isLoading} onRefresh={handleRetry} />
      </header>

      <section className="ss-stats">
        <article className="ss-stat-card">
          <div className="ss-stat-icon ss-stat-icon-blue">
            <Package size={21} />
          </div>
          <div className="ss-stat-content">
            <span>Tổng dịch vụ</span>
            <strong>{ready ? services.length : "—"}</strong>
            <small>Dịch vụ của cửa hàng</small>
          </div>
        </article>

        <article className="ss-stat-card">
          <div className="ss-stat-icon ss-stat-icon-green">
            <CheckCircle2 size={21} />
          </div>
          <div className="ss-stat-content">
            <span>Đang hoạt động</span>
            <strong>{ready ? activeCount : "—"}</strong>
            <small>Có thể được sử dụng</small>
          </div>
        </article>

        <article className="ss-stat-card">
          <div className="ss-stat-icon ss-stat-icon-orange">
            <PauseCircle size={21} />
          </div>
          <div className="ss-stat-content">
            <span>Tạm ngừng</span>
            <strong>{ready ? inactiveCount : "—"}</strong>
            <small>Không hoạt động</small>
          </div>
        </article>
      </section>

      <section className="ss-list-section">
        <div className="ss-list-heading">
          <div>
            <h2>Danh sách dịch vụ</h2>
            <p>
              Thông tin dịch vụ và giá áp dụng tại cửa hàng
            </p>
          </div>

          <span className="ss-result-count">
            {ready ? `${filteredServices.length} dịch vụ` : "—"}
          </span>
        </div>

        <div className="ss-toolbar">
          <div className="ss-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mô tả dịch vụ..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Tìm kiếm dịch vụ"
            />

            {searchTerm && (
              <button
                type="button"
                className="ss-clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Xóa nội dung tìm kiếm"
              >
                ×
              </button>
            )}
          </div>

          <div className="ss-filter-control">
            <Filter size={17} />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as ServiceStatusFilter,
                )
              }
              aria-label="Lọc theo trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngừng</option>
            </select>
          </div>

          <div className="ss-filter-control">
            <select
              value={pricingUnitFilter}
              onChange={(event) =>
                setPricingUnitFilter(
                  event.target.value as PricingUnitFilter,
                )
              }
              aria-label="Lọc theo đơn vị tính"
            >
              <option value="all">Tất cả đơn vị</option>
              <option value="per_kg">Theo kg</option>
              <option value="per_item">Theo sản phẩm</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="ss-error-banner" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
            <button type="button" onClick={handleRetry}>
              Thử lại
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="ss-loading" role="status">
            <div className="ss-spinner" />
            <p>Đang tải danh sách dịch vụ...</p>
          </div>
        ) : error && services.length === 0 ? (
          <div className="ss-empty-state ss-inline-empty">
            <div className="ss-empty-icon ss-error-icon">
              <AlertCircle size={28} />
            </div>
            <h3>Không thể tải dữ liệu</h3>
            <p>Vui lòng kiểm tra kết nối và thử tải lại.</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="ss-empty-state ss-inline-empty">
            <div className="ss-empty-icon">
              <Package size={28} />
            </div>
            <h3>
              {services.length === 0
                ? "Chưa có dịch vụ"
                : "Không tìm thấy dịch vụ"}
            </h3>
            <p>
              {services.length === 0
                ? "Cửa hàng hiện chưa có dịch vụ nào được ghi nhận."
                : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."}
            </p>
          </div>
        ) : (
          <div className="ss-service-grid">
            {filteredServices.map((service) => (
              <article className="ss-service-card" key={service.id}>
                <div className="ss-service-top">
                  <div className="ss-service-icon">
                    {service.pricing_unit === "per_kg" ? (
                      <Droplets size={23} />
                    ) : (
                      <Package size={23} />
                    )}
                  </div>

                  <span
                    className={`ss-status ${
                      service.status === "active"
                        ? "ss-status-active"
                        : "ss-status-inactive"
                    }`}
                  >
                    <span className="ss-status-dot" />
                    {service.status === "active"
                      ? "Đang hoạt động"
                      : "Tạm ngừng"}
                  </span>
                </div>

                <div className="ss-service-info">
                  <h3>{service.name}</h3>
                  <p>
                    {service.description?.trim() ||
                      "Chưa có mô tả cho dịch vụ này."}
                  </p>
                </div>

                <div className="ss-service-price">
                  <span>Giá dịch vụ</span>
                  <strong>{formatPrice(service.unit_price)}</strong>
                  <small>
                    {formatPricingUnit(service.pricing_unit)}
                  </small>
                </div>

                <div className="ss-service-footer">
                  <div className="ss-turnaround">
                    <Clock3 size={16} />
                    <span>Thời gian xử lý</span>
                  </div>
                  <strong>
                    {formatTurnaround(
                      service.estimated_turnaround_hours,
                    )}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && filteredServices.length > 0 && (
          <div className="ss-list-footer">
            Đang hiển thị{" "}
            <strong>{filteredServices.length}</strong> /{" "}
            <strong>{ready ? services.length : "—"}</strong> dịch vụ
          </div>
        )}
      </section>

      <div className="ss-readonly-note">
        <AlertCircle size={17} />
        <span>
          Đây là trang xem thông tin. Việc thêm, sửa hoặc thay đổi giá
          dịch vụ cần được thực hiện bởi người có quyền quản lý phù hợp.
        </span>
      </div>
    </div>
  );
}