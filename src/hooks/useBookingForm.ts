import { useState } from "react";
import { toLocalDateString } from "../lib/pickup";

export type ItemRow = { key: number; name: string; quantity: number };

// Trạng thái form đặt lịch. Giữ ở component cha để không mất dữ liệu khi chuyển trang (vd. sang Địa chỉ để thêm mới).
export function useBookingForm() {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [weight, setWeight] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ key: 1, name: "", quantity: 1 }]);
  const [inStore, setInStore] = useState(false);
  const [date, setDate] = useState(() => toLocalDateString(new Date()));
  // Slot người dùng chọn; slot thực sự dùng được suy ra từ danh sách slot của ngày đó
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [nextItemKey, setNextItemKey] = useState(2);

  const reset = () => {
    setStep(1);
    setServiceId(null);
    setWeight("");
    setItems([{ key: 1, name: "", quantity: 1 }]);
    setNextItemKey(2);
    setInStore(false);
    setDate(toLocalDateString(new Date()));
    setSlot(null);
    setNote("");
    setPromoInput("");
    setAppliedPromo("");
  };

  return {
    step, setStep, serviceId, setServiceId, weight, setWeight, items, setItems, nextItemKey, setNextItemKey,
    inStore, setInStore, date, setDate, slot, setSlot, note, setNote,
    promoInput, setPromoInput, appliedPromo, setAppliedPromo, reset,
  };
}

export type BookingForm = ReturnType<typeof useBookingForm>;
