import { useEffect, useRef, useState } from "react";
import { Truck, WashingMachine } from "lucide-react";
import { useFetched } from "../../../../hooks/useFetched";
import { getErrorMessage } from "../../../../lib/error";
import { machineService } from "../../../../services/machine";
import { staffService } from "../../../../services/staff";
import { userService } from "../../../../services/user";
import { BOOKING_STATUS_LABELS } from "../../../../services/booking";

export default function BookingAssignDialog({ storeId, bookingId, bookingCode, onClose, onChanged }: {
  storeId: number;
  bookingId: number;
  bookingCode: string;
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const [reloadToken, setReloadToken] = useState(0);
  const [machineId, setMachineId] = useState("");
  const [shipperId, setShipperId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const submittingRef = useRef(false);
  const activeRef = useRef(true);
  const bookingFetch = useFetched(`assign-booking:${storeId}:${bookingId}:${reloadToken}`,
    (signal) => staffService.getBookingDetail(bookingId, signal));
  const machinesFetch = useFetched(`assign-machines:${storeId}:${bookingId}:${reloadToken}`,
    (signal) => machineService.listForBooking(storeId, bookingId, signal));
  const shippers = useFetched(`assign-shippers:${reloadToken}`, (signal) => userService.getShippers(signal));
  const booking = bookingFetch.data;
  const machines = machinesFetch.data ?? [];
  const bookingWeight = booking?.actual_weight_kg ?? booking?.estimated_weight_kg;
  const weight = bookingWeight == null ? null : Number(bookingWeight);
  const availableMachines = machines.filter((machine) =>
    machine.available_for_booking === true && !machine.assigned_to_booking &&
    machine.status !== "maintenance" && machine.status !== "offline" && (weight === null || machine.capacity_kg >= weight),
  );
  const machineStatusAllowed = Boolean(booking && ["confirmed", "picked_up", "processing"].includes(booking.status));
  const canAssignMachine = machineStatusAllowed && availableMachines.some((machine) => String(machine.id) === machineId);
  const selectedShipper = shippers.data?.find((shipper) => String(shipper.id) === shipperId);
  const delivery = booking?.delivery_trips?.find((trip) => trip.trip_type === "delivery");
  const tripCanAssign = !delivery || delivery.status === "unassigned" || delivery.status === "assigned";
  const shipperStatusAllowed = booking?.status === "ready_for_delivery" && !booking.in_store && tripCanAssign;
  const canAssignShipper = shipperStatusAllowed && Boolean(selectedShipper);
  const machineStatusHint = booking && !machineStatusAllowed
    ? `Không thể gán máy khi đơn ở trạng thái “${BOOKING_STATUS_LABELS[booking.status]}”. Chỉ gán máy cho đơn đã xác nhận, đã lấy đồ hoặc đang xử lý.`
    : "";
  const shipperStatusHint = booking && !booking.in_store && booking.status !== "ready_for_delivery"
    ? `Chưa thể gán shipper vì đơn đang ở trạng thái “${BOOKING_STATUS_LABELS[booking.status]}”. Chỉ gán shipper khi đơn sẵn sàng giao.`
    : "";

  useEffect(() => {
    activeRef.current = true;
    dialogRef.current?.focus();
    return () => { activeRef.current = false; };
  }, []);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), select:not(:disabled)");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [saving, onClose]);

  const assignMachine = async () => {
    if (submittingRef.current || !canAssignMachine) return;
    submittingRef.current = true;
    setSaving(true); setError(""); setSuccess("");
    try {
      await machineService.assign(storeId, Number(machineId), bookingId);
      if (!activeRef.current) return;
      const message = `Đã gán máy ${machines.find((machine) => String(machine.id) === machineId)?.name ?? machineId} cho đơn #${bookingCode}.`;
      setSuccess(message);
      setMachineId("");
      setReloadToken((value) => value + 1);
      onChanged(message);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể gán máy. Vui lòng thử lại."));
      setReloadToken((value) => value + 1);
    } finally { submittingRef.current = false; setSaving(false); }
  };

  const assignShipper = async () => {
    if (submittingRef.current || !canAssignShipper || !selectedShipper) return;
    submittingRef.current = true;
    setSaving(true); setError(""); setSuccess("");
    try {
      await staffService.assignShipper(bookingId, selectedShipper.id);
      if (!activeRef.current) return;
      const message = `Đã gán shipper ${selectedShipper.full_name} cho đơn #${bookingCode}.`;
      setSuccess(message);
      onChanged(message);
      setShipperId("");
      setReloadToken((value) => value + 1);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể gán shipper. Vui lòng thử lại."));
      setReloadToken((value) => value + 1);
    } finally { submittingRef.current = false; setSaving(false); }
  };

  return (
    <div className="booking-modal-overlay" onMouseDown={(event) => {
      if (!saving && event.target === event.currentTarget) onClose();
    }}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-assign-title" tabIndex={-1} ref={dialogRef}>
        <div className="booking-modal__heading">
          <div><span className="booking-page__eyebrow">PHÂN CÔNG ĐƠN HÀNG</span><h2 id="booking-assign-title">Assign · #{bookingCode}</h2></div>
          <button type="button" className="booking-modal__close" aria-label="Đóng phân công" disabled={saving} onClick={onClose}>×</button>
        </div>
        <div className="booking-modal__body booking-assign-body">
          {success && <p role="status">{success}</p>}
          {error && <p role="alert">{error}</p>}
          {bookingFetch.status === "loading" && <p role="status">Đang tải thông tin đơn hàng...</p>}
          {bookingFetch.status === "error" && <div role="alert"><p>{bookingFetch.error}</p><button type="button" onClick={() => setReloadToken((value) => value + 1)}>Thử lại</button></div>}
          {booking && <p>Trạng thái đơn: <strong>{BOOKING_STATUS_LABELS[booking.status]}</strong></p>}
          <div className="booking-assign-section">
            <label htmlFor="assign-machine"><WashingMachine size={18} /> Máy giặt / máy sấy</label>
            <select id="assign-machine" value={machineId} disabled={saving || machinesFetch.status !== "ready" || machines.length === 0 || !machineStatusAllowed} aria-describedby={machineStatusHint ? "assign-machine-status-hint" : undefined} onChange={(event) => setMachineId(event.target.value)}>
              <option value="">Chọn máy ({availableMachines.length} máy trống trong ca)</option>
              {machines.map((machine) => {
                const reason = machine.assigned_to_booking ? "Đã gán cho đơn này"
                  : machine.status === "maintenance" ? "Bảo trì"
                  : machine.status === "offline" ? "Ngừng hoạt động"
                  : machine.available_for_booking === false ? "Đã được đặt trong khung giờ này"
                  : machine.available_for_booking !== true ? "Chưa có thông tin trống theo ca"
                  : weight !== null && machine.capacity_kg < weight ? "Không đủ sức chứa" : "";
                return <option key={machine.id} value={machine.id} disabled={Boolean(reason)}>
                  {machine.name} · {machine.capacity_kg} kg{reason ? ` · ${reason}` : " · Trống trong ca"}
                </option>;
              })}
            </select>
            {machinesFetch.status === "loading" && <p role="status">Đang tải máy...</p>}
            {machinesFetch.error && <div role="alert"><p>{machinesFetch.error}</p><button type="button" onClick={() => setReloadToken((value) => value + 1)}>Thử lại</button></div>}
            {machinesFetch.status === "ready" && machines.length === 0 && <p>Không có máy cho khung giờ của đơn này.</p>}
            {machinesFetch.status === "ready" && machineStatusAllowed && availableMachines.length === 0 && <p>Không còn máy có thể gán thêm trong ca hoặc không đủ sức chứa.</p>}
            <button type="button" className="booking-page__refresh" disabled={saving || !canAssignMachine} aria-describedby={machineStatusHint ? "assign-machine-status-hint" : undefined} onClick={() => void assignMachine()}>{saving ? "Đang gán..." : "Gán máy"}</button>
            {machineStatusHint && <p id="assign-machine-status-hint" className="booking-assign-status-hint" role="status">{machineStatusHint}</p>}
          </div>
          <div className="booking-assign-section">
            <label htmlFor="assign-shipper"><Truck size={18} /> Shipper</label>
            <select id="assign-shipper" value={shipperId} disabled={saving || shippers.status !== "ready" || !shippers.data?.length || !shipperStatusAllowed} aria-describedby={shipperStatusHint ? "assign-shipper-status-hint" : undefined} onChange={(event) => setShipperId(event.target.value)}>
              <option value="">Chọn shipper</option>
              {(shippers.data ?? []).map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.full_name}{shipper.phone ? ` · ${shipper.phone}` : ""}</option>)}
            </select>
            {shippers.status === "loading" && <p role="status">Đang tải shipper...</p>}
            {shippers.error && <div role="alert"><p>{shippers.error}</p><button type="button" onClick={() => setReloadToken((value) => value + 1)}>Thử lại</button></div>}
            {booking?.in_store && <p>Đơn mang đến cửa hàng không cần shipper.</p>}
            {delivery?.shipper && <p>Đang gán: {delivery.shipper.full_name}{delivery.shipper.phone ? ` · ${delivery.shipper.phone}` : ""}</p>}
            {!tripCanAssign && <p>Chuyến giao đã bắt đầu hoặc kết thúc, không thể đổi shipper.</p>}
            {shippers.status === "ready" && shippers.data?.length === 0 && <p>Không có shipper đang hoạt động.</p>}
            <button type="button" className="booking-page__refresh" disabled={saving || !canAssignShipper} aria-describedby={shipperStatusHint ? "assign-shipper-status-hint" : undefined} onClick={() => void assignShipper()}>{saving ? "Đang gán..." : "Gán shipper"}</button>
            {shipperStatusHint && <p id="assign-shipper-status-hint" className="booking-assign-status-hint" role="status">{shipperStatusHint}</p>}
          </div>
        </div>
        <div className="booking-modal__footer"><button type="button" className="booking-page__refresh" disabled={saving} onClick={onClose}>Đóng</button></div>
      </section>
    </div>
  );
}
