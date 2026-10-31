import { useEffect, useMemo, useState } from "react";
import {
    Store as StoreIcon,
    Plus,
    Search,
    MapPin,
    Phone,
    Edit3,
    PowerOff,
    UserPlus,
    CheckCircle2,
    XCircle,
    RefreshCw,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    adminStoreService,
    type AdminStore,
    type CreateStorePayload,
} from "../../services/store";

const fallbackStores: AdminStore[] = [
    {
        id: 1,
        name: "Laundry Smart City - Cơ sở Tây Mỗ",
        address: "Khu đô thị Vinhomes Smart City, Nam Từ Liêm, Hà Nội",
        phone: "0988111222",
        description: "Cơ sở chính chuyên giặt sấy nhanh công nghệ cao và giặt khô cao cấp.",
        image_url: null,
        latitude: 21.0031,
        longitude: 105.7445,
        status: "active",
        cancellation_hours_before: 2,
        cancellation_refund_percent: 100,
    },
    {
        id: 2,
        name: "Laundry Cầu Giấy - Cơ sở Dịch Vọng",
        address: "125 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
        phone: "0988333444",
        description: "Phục vụ khu vực sinh viên và văn phòng quận Cầu Giấy.",
        image_url: null,
        latitude: 21.0368,
        longitude: 105.7821,
        status: "active",
        cancellation_hours_before: 4,
        cancellation_refund_percent: 80,
    },
    {
        id: 3,
        name: "Laundry Hà Đông - Cơ sở Nguyễn Trãi",
        address: "450 Quang Trung, Hà Đông, Hà Nội",
        phone: "0988555666",
        description: "Đang bảo trì nâng cấp hệ thống máy sấy công nghiệp.",
        image_url: null,
        latitude: 20.9714,
        longitude: 105.7788,
        status: "inactive",
        cancellation_hours_before: 2,
        cancellation_refund_percent: 100,
    },
];

export default function StoreManagementPage() {
    const [stores, setStores] = useState<AdminStore[]>(fallbackStores);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "inactive">("ALL");

    // Modal Tạo / Sửa cửa hàng
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<AdminStore | null>(null);
    const [formData, setFormData] = useState<CreateStorePayload>({
        name: "",
        address: "",
        phone: "",
        description: "",
        cancellation_hours_before: 2,
        cancellation_refund_percent: 100,
        status: "active",
    });

    // Modal Gán nhân viên
    const [assignModalStore, setAssignModalStore] = useState<AdminStore | null>(null);
    const [staffIdInput, setStaffIdInput] = useState("");

    const fetchStores = async () => {
        setLoading(true);
        try {
            const res = await adminStoreService.getManageableStores({ limit: 50 });
            if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                setStores(res.data);
            }
        } catch {
            // Giữ fallbackStores khi chưa bật server backend
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const filteredStores = useMemo(() => {
        const q = search.trim().toLowerCase();
        return stores.filter((store) => {
            const currentStatus = store.status ?? "active";
            const matchSearch =
                store.name.toLowerCase().includes(q) ||
                store.address.toLowerCase().includes(q) ||
                (store.phone ?? "").includes(q);
            const matchStatus = statusFilter === "ALL" || currentStatus === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [stores, search, statusFilter]);

    const activeCount = stores.filter((s) => (s.status ?? "active") === "active").length;
    const inactiveCount = stores.length - activeCount;

    const openCreateModal = () => {
        setEditingStore(null);
        setFormData({
            name: "",
            address: "",
            phone: "",
            description: "",
            cancellation_hours_before: 2,
            cancellation_refund_percent: 100,
            status: "active",
        });
        setIsFormOpen(true);
    };

    const openEditModal = (store: AdminStore) => {
        setEditingStore(store);
        setFormData({
            name: store.name,
            address: store.address,
            phone: store.phone ?? "",
            description: store.description ?? "",
            cancellation_hours_before: store.cancellation_hours_before ?? 2,
            cancellation_refund_percent: store.cancellation_refund_percent ?? 100,
            status: store.status ?? "active",
        });
        setIsFormOpen(true);
    };

    const handleSaveStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.address.trim()) return;

        try {
            if (editingStore) {
                const updated = await adminStoreService.updateStore(editingStore.id, formData);
                setStores((prev) =>
                    prev.map((item) => (item.id === editingStore.id ? { ...item, ...updated } : item)),
                );
            } else {
                const created = await adminStoreService.createStore(formData);
                setStores((prev) => [created, ...prev]);
            }
        } catch {
            // Fallback cập nhật state local nếu chưa bật Backend
            if (editingStore) {
                setStores((prev) =>
                    prev.map((item) =>
                        item.id === editingStore.id
                            ? {
                                ...item,
                                name: formData.name,
                                address: formData.address,
                                phone: formData.phone || null,
                                description: formData.description || null,
                                status: formData.status,
                                cancellation_hours_before: formData.cancellation_hours_before,
                                cancellation_refund_percent: formData.cancellation_refund_percent,
                            }
                            : item,
                    ),
                );
            } else {
                const newStore: AdminStore = {
                    id: Date.now(),
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone || null,
                    description: formData.description || null,
                    image_url: null,
                    latitude: null,
                    longitude: null,
                    status: formData.status ?? "active",
                    cancellation_hours_before: formData.cancellation_hours_before,
                    cancellation_refund_percent: formData.cancellation_refund_percent,
                };
                setStores((prev) => [newStore, ...prev]);
            }
        }
        setIsFormOpen(false);
    };

    const handleToggleStoreStatus = async (store: AdminStore) => {
        const currentStatus = store.status ?? "active";
        const nextStatus = currentStatus === "active" ? "inactive" : "active";
        const confirmed = window.confirm(
            `Bạn có chắc muốn ${nextStatus === "inactive" ? "ngừng hoạt động" : "kích hoạt lại"} "${store.name}"?`,
        );
        if (!confirmed) return;

        try {
            if (nextStatus === "inactive") {
                await adminStoreService.deactivateStore(store.id);
            } else {
                await adminStoreService.updateStore(store.id, { status: "active" });
            }
        } catch {
            // Fallback state update
        }

        setStores((prev) =>
            prev.map((s) => (s.id === store.id ? { ...s, status: nextStatus } : s)),
        );
    };

    const handleAssignStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignModalStore || !staffIdInput.trim()) return;
        const staffId = Number(staffIdInput);
        if (Number.isNaN(staffId) || staffId < 1) {
            alert("ID nhân viên phải là số nguyên dương!");
            return;
        }

        try {
            await adminStoreService.assignStaff(assignModalStore.id, staffId);
            alert(`Đã gán nhân viên ID #${staffId} vào ${assignModalStore.name} thành công!`);
        } catch {
            alert(
                `Đã ghi nhận gán nhân viên ID #${staffId} vào "${assignModalStore.name}" (Chế độ Offline/Demo).`,
            );
        }
        setStaffIdInput("");
        setAssignModalStore(null);
    };

    return (
        <AdminLayout>
            <div className="space-y-7">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Quản lý chuỗi cửa hàng
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Thiết lập cơ sở giặt là, phân công nhân sự và cấu hình chính sách hoàn hủy.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fetchStores}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            Làm mới
                        </button>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                        >
                            <Plus size={18} />
                            Thêm cửa hàng
                        </button>
                    </div>
                </div>

                {/* Thống kê */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">Tổng số cơ sở</p>
                            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                                <StoreIcon size={21} />
                            </div>
                        </div>
                        <p className="mt-4 text-3xl font-bold text-slate-900">{stores.length}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">Đang hoạt động</p>
                            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                                <CheckCircle2 size={21} />
                            </div>
                        </div>
                        <p className="mt-4 text-3xl font-bold text-slate-900">{activeCount}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-500">Tạm ngừng / Bảo trì</p>
                            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
                                <XCircle size={21} />
                            </div>
                        </div>
                        <p className="mt-4 text-3xl font-bold text-slate-900">{inactiveCount}</p>
                    </div>
                </div>

                {/* Bộ lọc & Danh sách */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo tên cơ sở, địa chỉ hoặc số điện thoại..."
                                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value as "ALL" | "active" | "inactive")
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Ngừng hoạt động</option>
                            </select>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredStores.map((store) => {
                            const isActive = (store.status ?? "active") === "active";
                            return (
                                <div
                                    key={store.id}
                                    className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50 lg:flex-row lg:items-center"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <span className="text-base font-bold text-slate-900">
                                                {store.name}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                <span
                                                    className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"
                                                        }`}
                                                />
                                                {isActive ? "Hoạt động" : "Tạm ngừng"}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                            <span className="inline-flex items-center gap-1.5">
                                                <MapPin size={15} className="text-slate-400" />
                                                {store.address}
                                            </span>
                                            {store.phone && (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Phone size={15} className="text-slate-400" />
                                                    {store.phone}
                                                </span>
                                            )}
                                        </div>

                                        {store.description && (
                                            <p className="text-xs text-slate-500">{store.description}</p>
                                        )}

                                        <p className="text-xs text-slate-400">
                                            Chính sách hủy: Trước{" "}
                                            <strong className="text-slate-600">
                                                {store.cancellation_hours_before ?? 2} giờ
                                            </strong>{" "}
                                            • Hoàn tiền:{" "}
                                            <strong className="text-slate-600">
                                                {store.cancellation_refund_percent ?? 100}%
                                            </strong>
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAssignModalStore(store)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                        >
                                            <UserPlus size={15} />
                                            Gán Staff
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => openEditModal(store)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            <Edit3 size={15} />
                                            Chỉnh sửa
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleStoreStatus(store)}
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${isActive
                                                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                }`}
                                        >
                                            <PowerOff size={15} />
                                            {isActive ? "Ngừng" : "Mở lại"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredStores.length === 0 && (
                            <div className="py-14 text-center text-sm text-slate-500">
                                Không tìm thấy cửa hàng nào phù hợp.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Modal Thêm / Chỉnh sửa Cửa hàng */}
            {isFormOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
                    onClick={() => setIsFormOpen(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-slate-900">
                            {editingStore ? "Cập nhật cửa hàng" : "Thêm cửa hàng mới"}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Hệ thống sẽ tự động định vị tọa độ bản đồ dựa trên địa chỉ cửa hàng.
                        </p>

                        <form onSubmit={handleSaveStore} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700">
                                    Tên cửa hàng *
                                </label>
                                <input
                                    required
                                    minLength={2}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Laundry Smart City - Cơ sở 1"
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">
                                    Địa chỉ chi tiết *
                                </label>
                                <input
                                    required
                                    minLength={5}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="VD: Tòa I5 Vinhomes Smart City, Tây Mỗ, Hà Nội"
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Số điện thoại
                                    </label>
                                    <input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="0988..."
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as "active" | "inactive",
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    >
                                        <option value="active">Hoạt động (Active)</option>
                                        <option value="inactive">Tạm ngừng (Inactive)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Số giờ cho phép hủy trước
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={720}
                                        value={formData.cancellation_hours_before}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                cancellation_hours_before: Number(e.target.value),
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Tỷ lệ hoàn tiền khi hủy (%)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={formData.cancellation_refund_percent}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                cancellation_refund_percent: Number(e.target.value),
                                            })
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">
                                    Mô tả cửa hàng
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Ghi chú về dịch vụ nổi bật hoặc giờ mở cửa..."
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    {editingStore ? "Lưu thay đổi" : "Tạo cửa hàng"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Gán Nhân viên (Staff) */}
            {assignModalStore && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
                    onClick={() => setAssignModalStore(null)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-slate-900">
                            Phân công nhân viên (Staff)
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Cửa hàng:{" "}
                            <strong className="text-slate-800">{assignModalStore.name}</strong>
                        </p>

                        <form onSubmit={handleAssignStaff} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700">
                                    Nhập ID nhân viên (User ID có vai trò STAFF) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={staffIdInput}
                                    onChange={(e) => setStaffIdInput(e.target.value)}
                                    placeholder="VD: 2"
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignModalStore(null)}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    Xác nhận gán
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}