import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  ShieldCheck,
  MoreHorizontal,
  Eye,
  Lock,
  Unlock,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import type {
  User,
  UserRole,
  UserStatus,
} from "../../types/user";

const initialUsers: User[] = [
  {
    id: 1,
    fullName: "Nguyễn Minh Anh",
    email: "minhanh@example.com",
    phone: "0901234567",
    role: "CUSTOMER",
    status: "ACTIVE",
    createdAt: "2026-09-20",
  },
  {
    id: 2,
    fullName: "Trần Quốc Huy",
    email: "quochuy@example.com",
    phone: "0912345678",
    role: "STAFF",
    status: "ACTIVE",
    createdAt: "2026-09-18",
  },
  {
    id: 3,
    fullName: "Lê Thu Hà",
    email: "thuha@example.com",
    phone: "0923456789",
    role: "CUSTOMER",
    status: "INACTIVE",
    createdAt: "2026-09-15",
  },
  {
    id: 4,
    fullName: "Phạm Hoàng Nam",
    email: "hoangnam@example.com",
    phone: "0934567890",
    role: "ADMIN",
    status: "PENDING",
    createdAt: "2026-09-12",
  },
  {
    id: 5,
    fullName: "Đỗ Ngọc Lan",
    email: "ngoclan@example.com",
    phone: "0945678901",
    role: "CUSTOMER",
    status: "BANNED",
    createdAt: "2026-09-10",
  },
  {
    id: 6,
    fullName: "Vũ Đức Long",
    email: "duclong@example.com",
    phone: "0956789012",
    role: "STAFF",
    status: "INACTIVE",
    createdAt: "2026-09-08",
  },
];

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng",
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Chưa kích hoạt",
  BANNED: "Bị cấm",
  PENDING: "Đang chờ",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [menuUserId, setMenuUserId] = useState<number | null>(null);

  const pageSize = 5;

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.phone.includes(keyword);

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / pageSize),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const activeCount = users.filter(
    (user) => user.status === "ACTIVE",
  ).length;

  const staffCount = users.filter(
    (user) => user.role === "STAFF",
  ).length;

  const customerCount = users.filter(
    (user) => user.role === "CUSTOMER",
  ).length;

  function toggleStatus(user: User) {
    const nextStatus: UserStatus =
      user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const confirmed = window.confirm(
      `${nextStatus === "INACTIVE" ? "Chưa kích hoạt" : "Kích hoạt"} tài khoản ${user.fullName}?`,
    );

    if (!confirmed) return;

    setUsers((previous) =>
      previous.map((item) =>
        item.id === user.id
          ? { ...item, status: nextStatus }
          : item,
      ),
    );

    setMenuUserId(null);
  }

  function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa user ${user.fullName}?`,
    );

    if (!confirmed) return;

    setUsers((previous) =>
      previous.filter((item) => item.id !== user.id),
    );

    setMenuUserId(null);
  }

  return (
    <AdminLayout>
      <div className="space-y-7">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản lý người dùng
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý tài khoản, vai trò và trạng thái người dùng.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              alert("Tích hợp form tạo user tại đây.")
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} />
            Thêm người dùng
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tổng người dùng"
            value={users.length}
            icon={<Users size={21} />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Đang hoạt động"
            value={activeCount}
            icon={<UserCheck size={21} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            label="Khách hàng"
            value={customerCount}
            icon={<Users size={21} />}
            iconClass="bg-violet-50 text-violet-600"
          />

          <StatCard
            label="Nhân viên"
            value={staffCount}
            icon={<ShieldCheck size={21} />}
            iconClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* User table */}
        <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Danh sách người dùng
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tìm kiếm và quản lý tài khoản trong hệ thống.
            </p>

            <div className="mt-5 flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Nhân viên</option>
                <option value="CUSTOMER">Khách hàng</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="LOCKED">Bị khóa</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Người dùng</th>
                  <th className="px-5 py-4 font-semibold">Số điện thoại</th>
                  <th className="px-5 py-4 font-semibold">Vai trò</th>
                  <th className="px-5 py-4 font-semibold">Trạng thái</th>
                  <th className="px-5 py-4 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                          {user.fullName
                            .split(" ")
                            .slice(-2)
                            .map((part) => part[0])
                            .join("")}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {user.fullName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {user.phone}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {roleLabels[user.role]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />
                        {statusLabels[user.status]}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {new Date(
                        user.createdAt + "T00:00:00",
                      ).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="relative px-5 py-4 text-right">
                      <button
                        type="button"
                        aria-label={`Thao tác với ${user.fullName}`}
                        onClick={() =>
                          setMenuUserId(
                            menuUserId === user.id ? null : user.id,
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      {menuUserId === user.id && (
                        <div className="absolute right-8 top-12 z-20 w-48 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setMenuUserId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={16} />
                            Xem chi tiết
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleStatus(user)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {user.status === "ACTIVE" ? (
                              <Lock size={16} />
                            ) : (
                              <Unlock size={16} />
                            )}
                            {user.status === "ACTIVE"
                              ? "Khóa tài khoản"
                              : "Mở khóa tài khoản"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteUser(user)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Xóa người dùng
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {paginatedUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <Users
                        size={32}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 font-medium text-slate-700">
                        Không tìm thấy người dùng
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Thử thay đổi từ khóa hoặc bộ lọc.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Hiển thị{" "}
              {filteredUsers.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {" - "}
              {Math.min(currentPage * pageSize, filteredUsers.length)}
              {" trên "}
              {filteredUsers.length} người dùng
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((previous) => Math.max(1, previous - 1))
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="px-2 text-sm text-slate-600">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((previous) =>
                    Math.min(totalPages, previous + 1),
                  )
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                id="user-detail-title"
                className="text-lg font-bold text-slate-900"
              >
                Chi tiết người dùng
              </h2>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <DetailRow label="ID" value={String(selectedUser.id)} />
              <DetailRow
                label="Họ và tên"
                value={selectedUser.fullName}
              />
              <DetailRow label="Email" value={selectedUser.email} />
              <DetailRow
                label="Số điện thoại"
                value={selectedUser.phone}
              />
              <DetailRow
                label="Vai trò"
                value={roleLabels[selectedUser.role]}
              />
              <DetailRow
                label="Trạng thái"
                value={statusLabels[selectedUser.status]}
              />
              <DetailRow
                label="Ngày tạo"
                value={selectedUser.createdAt}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="break-all text-sm font-medium text-slate-800 sm:text-right">
        {value}
      </span>
    </div>
  );
}