import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, BadgeCheck, CalendarDays, Check, CheckCircle2, CircleHelp, Home, MapPin, MapPinned,
  Minus, Package, Plus, Search, Shirt, Star, Tag, Trash2, Truck, WashingMachine,
} from "lucide-react";
import { getErrorMessage } from "../../lib/error";
import { MAX_ADVANCE_DAYS, addDays, toLocalDateString } from "../../lib/pickup";
import { formatAddress } from "../../services/address";
import { BookingService } from "../../services/booking";
import { getDeliveryFee } from "../../services/delivery";
import { getAvailableSlots, getStoreServices } from "../../services/store-booking";
import type { Address } from "../../types/address";
import type { Booking, CreateBookingInput } from "../../types/booking";
import type { StoreService } from "../../types/store-booking";
import { PageHeading } from "./PageHeading";
import { formatMoney, formatStoreDate, formatStoreTime } from "./format";
import { type BookingForm, type ItemRow } from "../../hooks/useBookingForm";
import { useFetched } from "../../hooks/useFetched";

export type BookingStoreItem = {
  id: number; name: string; address: string; phone: string;
  distance?: string; time?: string; rating?: number;
};

const STEP_LABELS = ["Cửa hàng & dịch vụ", "Thời gian & địa chỉ", "Xác nhận"];
const MAX_ITEMS = 50;
const MIN_ORDER_AMOUNT = 10_000;
const MIN_ORDER_MESSAGE = "Đơn đặt hàng phải tối thiểu 10,000";

// Phần dữ liệu theo loại dịch vụ: cân nặng (per_kg) hoặc danh sách món (per_item). null nếu chưa hợp lệ.
function serviceInput(service: StoreService, weight: string, items: ItemRow[]): Pick<CreateBookingInput, "estimated_weight_kg" | "items"> | null {
  if (service.pricing_unit === "per_kg") {
    const value = Number(weight);
    if (!weight.trim() || !(value >= 0.1 && value <= 9999.99)) return null;
    return { estimated_weight_kg: Math.round(value * 100) / 100 };
  }

  const filled = items.filter(item => item.name.trim());
  if (filled.length === 0 || filled.length > MAX_ITEMS) return null;
  if (filled.some(item => item.name.trim().length > 100 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) return null;
  return { items: filled.map(item => ({ item_name: item.name.trim(), quantity: item.quantity })) };
}

const serviceQuantity = (service: StoreService, weight: string, items: ItemRow[]) =>
  service.pricing_unit === "per_kg"
    ? Number(weight) || 0
    : items.filter(item => item.name.trim()).reduce((sum, item) => sum + item.quantity, 0);

const unitLabel = (service: StoreService) => service.pricing_unit === "per_kg" ? "kg" : "món";

function normalizeServiceName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findMatchingService(
  services: StoreService[],
  requestedName: string,
): StoreService | undefined {
  const requested = normalizeServiceName(requestedName);

  // Ưu tiên khớp tên chính xác.
  const exactMatch = services.find(
    service => normalizeServiceName(service.name) === requested,
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Nếu tên có khác biệt nhỏ, thử khớp tên chứa nhau.
  return services.find(service => {
    const actual = normalizeServiceName(service.name);

    return actual.includes(requested) || requested.includes(actual);
  });
}

export function BookingPage(props: {
  form: BookingForm;
  stores: BookingStoreItem[];
  selectedStore: number | null; setSelectedStore: (id: number) => void;
  addresses: Address[]; addressesStatus: "loading" | "ready" | "error"; goToAddresses: () => void;
  selectedAddress: number | null; setSelectedAddress: (id: number) => void;
  // Tên dịch vụ khách chọn ở trang chủ / ô tìm kiếm: BookingPage tìm dịch vụ tương ứng rồi gọi onRequestedServiceHandled
  requestedServiceName: string | null;
  onRequestedServiceHandled: () => void;
  notify: (message: string) => void;
  onCreated: (booking: Booking) => void;
}) {
  const { form, stores, selectedStore, setSelectedStore, addresses, addressesStatus, goToAddresses, selectedAddress, setSelectedAddress, requestedServiceName, onRequestedServiceHandled, notify, onCreated } = props;
  const { step, setStep } = form;
  const [storeQuery, setStoreQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const storeData = stores.find(store => store.id === selectedStore) ?? stores[0];
  const storeId = storeData?.id ?? null;
  // Chưa chọn (hoặc địa chỉ đã bị xóa) thì dùng địa chỉ mặc định, không có thì địa chỉ đầu tiên
  const activeAddress = addresses.find(item => item.id === selectedAddress) ?? addresses.find(item => item.isDefault) ?? addresses[0];

  // ---- Dịch vụ của cửa hàng
  const servicesFetch = useFetched(storeId === null ? null : `services:${storeId}`, signal => getStoreServices(storeId!, {}, signal));
  const storeServices = servicesFetch.data ?? [];
  // Dịch vụ riêng của cửa hàng cũ không còn trong danh sách khi đổi cửa hàng -> tự bỏ chọn
  const service = storeServices.find(item => item.id === form.serviceId) ?? null;

  // ---- Khung giờ theo ngày (chỉ tải từ bước 2)
  const today = toLocalDateString(new Date());
  const lastDay = toLocalDateString(addDays(new Date(), MAX_ADVANCE_DAYS));
  const dateValid = form.date >= today && form.date <= lastDay;
  const slotsFetch = useFetched(step >= 2 && storeId !== null && dateValid ? `slots:${storeId}:${form.date}` : null, signal => getAvailableSlots(storeId!, form.date, signal));
  const slotList = slotsFetch.data?.slots ?? [];
  const slot = slotList.find(item => item.start === form.slot && item.is_available)?.start ?? slotList.find(item => item.is_available)?.start ?? null;

  const [deliveryReloadToken, setDeliveryReloadToken] = useState(0);
  const deliveryFetch = useFetched(
    step >= 2 && !form.inStore && storeId !== null && addressesStatus === "ready" && activeAddress
      ? `delivery-fee:${storeId}:${activeAddress.id}:${deliveryReloadToken}` : null,
    (signal) => getDeliveryFee({ store_id: storeId!, pickup_address_id: activeAddress!.id }, signal),
  );
  const deliveryReady = form.inStore || deliveryFetch.status === "ready";

  // ---- Dữ liệu gửi lên backend
  const serviceFields = service ? serviceInput(service, form.weight, form.items) : null;
  const input: CreateBookingInput | null = storeId !== null && service && serviceFields && slot && (form.inStore || activeAddress)
    ? {
      store_id: storeId, service_id: service.id, in_store: form.inStore, pickup_date: form.date, slot_start: slot,
      ...(form.inStore ? {} : { pickup_address_id: activeAddress!.id }),
      ...serviceFields,
      ...(form.appliedPromo && { promotion_code: form.appliedPromo }),
      ...(form.note.trim() && { special_instructions: form.note.trim() }),
    }
    : null;

  // ---- Báo giá (bước 3): giá chính thức, mã ưu đãi, chỗ trống còn lại
  const quoteFetch = useFetched(step === 3 && input ? `quote:${JSON.stringify(input)}` : null, () => BookingService.quote(input!));
  const quote = quoteFetch.data;

  const estimate = service ? service.unit_price * serviceQuantity(service, form.weight, form.items) : 0;

  // Báo giá bước 3 đã bao gồm phí ship; chỉ cộng phí riêng khi chưa có quote.
  const deliveryFee = form.inStore ? 0 : quote?.delivery_price ?? deliveryFetch.data?.total_fee;
  const totalEstimate = quote?.estimated_price ?? estimate + (deliveryFee ?? 0);
  const validOrderAmount = Number.isFinite(totalEstimate) && totalEstimate >= MIN_ORDER_AMOUNT;
  const canContinue = validOrderAmount && (step === 1
    ? Boolean(storeId !== null && service && serviceFields)
    : step === 2 ? Boolean(slot && (form.inStore || activeAddress) && deliveryReady) : false);

  const submit = async () => {
    if (!input || submitting || quoteFetch.status !== "ready" || !quote) return;
    setSubmitting(true);
    try {
      const booking = await BookingService.create(input);
      form.reset();
      onCreated(booking);
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Không thể đặt lịch. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = (key: number, patch: Partial<ItemRow>) => form.setItems(current => current.map(item => item.key === key ? { ...item, ...patch } : item));
  const addItem = () => {
    form.setItems(current => [...current, { key: form.nextItemKey, name: "", quantity: 1 }]);
    form.setNextItemKey(form.nextItemKey + 1);
  };

  // ---- Dịch vụ khách chọn từ trang chủ: ưu tiên cửa hàng đang chọn, không có thì chuyển sang cửa hàng đầu tiên có dịch vụ đó
  const { setServiceId } = form;
  const servicesStatus = servicesFetch.status;
  const servicesData = servicesFetch.data;
  // Giữ callback mới nhất mà không làm effect bên dưới chạy lại (và hủy request đang bay) mỗi lần render
  const callbacksRef = useRef({ notify, onRequestedServiceHandled });
  useEffect(() => {
    callbacksRef.current = { notify, onRequestedServiceHandled };
  });

  useEffect(() => {
    // Chờ danh sách cửa hàng và dịch vụ của cửa hàng đang chọn tải xong
    if (!requestedServiceName || stores.length === 0 || servicesStatus === "loading") return;

    const matchInCurrentStore = servicesData && findMatchingService(servicesData, requestedServiceName);
    if (matchInCurrentStore) {
      setServiceId(matchInCurrentStore.id);
      callbacksRef.current.onRequestedServiceHandled();
      return;
    }

    const controller = new AbortController();

    const findInOtherStores = async () => {
      const results = await Promise.all(
        stores.filter(store => store.id !== storeId).map(async store => {
          try {
            return { store, service: findMatchingService(await getStoreServices(store.id, {}, controller.signal), requestedServiceName) };
          } catch {
            // Một cửa hàng lỗi không ngăn việc tìm các cửa hàng còn lại
            return { store, service: undefined };
          }
        }),
      );

      if (controller.signal.aborted) return;

      // Promise.all giữ thứ tự của stores nên lấy cửa hàng đầu tiên có dịch vụ
      const match = results.find(result => result.service);
      if (match?.service) {
        setSelectedStore(match.store.id);
        setServiceId(match.service.id);
      } else {
        callbacksRef.current.notify(`Không tìm thấy cửa hàng cung cấp dịch vụ "${requestedServiceName}".`);
      }
      callbacksRef.current.onRequestedServiceHandled();
    };

    void findInOtherStores();

    return () => controller.abort();
  }, [requestedServiceName, stores, storeId, servicesStatus, servicesData, setServiceId, setSelectedStore]);

  return <>
    <PageHeading eyebrow="ĐẶT LỊCH ONLINE" title="Đặt lịch giặt của bạn" description="Chỉ vài bước đơn giản để quần áo sạch thơm được giao tận nhà." action={<div className="secure-note"><BadgeCheck size={17} /> Đặt lịch an toàn</div>} />
    <div className="booking-layout">
      <div className="booking-main">
        <div className="stepper">{STEP_LABELS.map((label, index) => <div className={`stepper-item ${step === index + 1 ? "current" : ""} ${step > index + 1 ? "done" : ""}`} key={label}><span>{step > index + 1 ? <Check size={16} /> : index + 1}</span><div><small>BƯỚC {index + 1}</small><strong>{label}</strong></div>{index < 2 && <div className="step-line" />}</div>)}</div>

        {step === 1 && <>
          <div className="panel"><div className="panel-heading"><div><h2><MapPin /> Chọn cửa hàng</h2><p>Chọn cửa hàng thuận tiện cho việc lấy đồ.</p></div><span className="optional-tag">Bắt buộc</span></div><div className="input-with-icon store-search"><Search /><input value={storeQuery} onChange={e => setStoreQuery(e.target.value)} placeholder="Tìm cửa hàng hoặc khu vực..." /></div>
            <div className="booking-store-list">{stores.filter(store => store.name.toLowerCase().includes(storeQuery.toLowerCase()) || store.address.toLowerCase().includes(storeQuery.toLowerCase())).map(store => <button key={store.id} className={`booking-store ${storeId === store.id ? "selected" : ""}`} onClick={() => setSelectedStore(store.id)}><span className="radio-dot">{storeId === store.id && <i />}</span><span className="store-mini-icon"><WashingMachine /></span><span className="booking-store-details"><strong>{store.name}</strong><small><MapPin size={12} /> {store.address}</small>{store.distance && <small><Truck size={12} /> {store.distance}{store.time ? ` · khoảng ${store.time}` : ""}</small>}</span>{store.rating !== undefined && <span className="booking-store-rating"><Star size={13} fill="currentColor" /> {store.rating}</span>}</button>)}</div>
          </div>
          <div className="panel"><div className="panel-heading"><div><h2><WashingMachine /> Chọn dịch vụ</h2><p>Mỗi đơn đặt một dịch vụ. Cần dịch vụ khác thì đặt thêm đơn mới.</p></div></div>
            {servicesFetch.status === "loading" && <p className="empty-summary">Đang tải dịch vụ...</p>}
            {servicesFetch.status === "error" && <p className="empty-summary">{servicesFetch.error}</p>}
            {servicesFetch.status === "ready" && storeServices.length === 0 && <p className="empty-summary">Cửa hàng này chưa có dịch vụ nào.</p>}
            <div className="booking-store-list">{storeServices.map((item, index) => <button key={item.id} className={`booking-store ${service?.id === item.id ? "selected" : ""}`} onClick={() => form.setServiceId(item.id)}><span className="radio-dot">{service?.id === item.id && <i />}</span><span className={`booking-service-icon service-icon-${(index % 4) + 1}`}>{item.pricing_unit === "per_kg" ? <WashingMachine /> : <Shirt />}</span><span className="booking-store-details"><strong>{item.name}</strong>{item.description && <small>{item.description}</small>}<small>{formatMoney(item.unit_price)} / {unitLabel(item)} · xử lý khoảng {item.estimated_turnaround_hours} giờ</small></span></button>)}</div>
          </div>
          {service && <div className="panel"><div className="panel-heading"><div><h2><Package /> {service.pricing_unit === "per_kg" ? "Khối lượng đồ giặt" : "Danh sách đồ giặt"}</h2><p>{service.pricing_unit === "per_kg" ? "Nhập cân nặng ước tính. Cửa hàng sẽ cân lại thực tế khi nhận đồ." : "Liệt kê từng món cần giặt."}</p></div></div>
            {service.pricing_unit === "per_kg"
              ? <label className="field-label">Cân nặng ước tính (kg)<input type="number" inputMode="decimal" min={0.1} max={9999.99} step={0.1} value={form.weight} onChange={e => form.setWeight(e.target.value)} placeholder="Ví dụ: 3.5" /></label>
              : <div className="item-rows">{form.items.map((item, index) => <div className="item-row" key={item.key}><input value={item.name} maxLength={100} onChange={e => updateItem(item.key, { name: e.target.value })} placeholder={`Món ${index + 1} (vd. Áo sơ mi trắng)`} aria-label={`Tên món ${index + 1}`} /><div className="quantity-control"><button aria-label="Giảm số lượng" onClick={() => updateItem(item.key, { quantity: Math.max(1, item.quantity - 1) })} disabled={item.quantity <= 1}><Minus size={14} /></button><span>{item.quantity}</span><button aria-label="Tăng số lượng" onClick={() => updateItem(item.key, { quantity: Math.min(100, item.quantity + 1) })} disabled={item.quantity >= 100}><Plus size={14} /></button></div><button className="icon-button" aria-label="Xóa món" onClick={() => form.setItems(current => current.length > 1 ? current.filter(row => row.key !== item.key) : current)} disabled={form.items.length <= 1}><Trash2 size={16} /></button></div>)}
                <button className="text-link" onClick={addItem} disabled={form.items.length >= MAX_ITEMS}><Plus size={15} /> Thêm món</button></div>}
          </div>}
        </>}

        {step === 2 && <div className="panel"><div className="panel-heading"><div><h2><CalendarDays /> {form.inStore ? "Thời gian mang đồ đến" : "Thời gian lấy đồ"}</h2><p>Chọn ngày và khung giờ còn chỗ của cửa hàng (đặt trước tối đa {MAX_ADVANCE_DAYS} ngày).</p></div></div>
          <div className="mode-toggle" role="radiogroup" aria-label="Hình thức">
            <button role="radio" aria-checked={!form.inStore} className={!form.inStore ? "active" : ""} onClick={() => form.setInStore(false)}><Truck size={16} /> Cửa hàng đến lấy & giao tận nơi</button>
            <button role="radio" aria-checked={form.inStore} className={form.inStore ? "active" : ""} onClick={() => form.setInStore(true)}><WashingMachine size={16} /> Tôi tự mang đến cửa hàng</button>
          </div>
          <div className="form-grid"><label className="field-label">{form.inStore ? "Ngày mang đồ đến" : "Ngày lấy đồ"}<input type="date" min={today} max={lastDay} value={form.date} onChange={e => form.setDate(e.target.value)} />{!dateValid && <small>Chỉ đặt được từ hôm nay đến {formatStoreDate(`${lastDay}T00:00`)}.</small>}</label></div>
          {slotsFetch.status === "loading" && <p className="empty-summary">Đang tải khung giờ...</p>}
          {slotsFetch.status === "error" && <p className="empty-summary">{slotsFetch.error}</p>}
          {slotsFetch.data && !slotsFetch.data.is_open && <p className="empty-summary">Cửa hàng không nhận đặt lịch vào ngày này, vui lòng chọn ngày khác.</p>}
          {slotsFetch.data?.is_open && slotList.length === 0 && <p className="empty-summary">Ngày này đã hết khung giờ, vui lòng chọn ngày khác.</p>}
          {slotList.length > 0 && <div className="slot-grid" role="radiogroup" aria-label="Khung giờ">{slotList.map(item => <button key={item.start} role="radio" aria-checked={slot === item.start} className={`slot-chip ${slot === item.start ? "selected" : ""}`} disabled={!item.is_available} onClick={() => form.setSlot(item.start)}><strong>{item.start} - {item.end}</strong><small>{item.is_available ? `Còn ${item.available} chỗ` : "Hết chỗ"}</small></button>)}</div>}
          {form.inStore
            ? <p className="empty-summary">Bạn tự mang đồ đến cửa hàng{storeData ? ` (${storeData.address})` : ""} vào khung giờ đã chọn và tự nhận lại khi giặt xong.</p>
            : <>
              <div className="panel-heading address-heading"><div><h2><MapPinned /> Địa chỉ lấy & giao đồ</h2><p>Shipper sẽ đến lấy đồ và giao lại tại địa chỉ này.</p></div><button className="text-link" onClick={goToAddresses}><Plus size={15} /> Thêm địa chỉ</button></div>
              {addressesStatus === "loading" && <p className="empty-summary">Đang tải địa chỉ...</p>}
              {addressesStatus === "error" && <p className="empty-summary">Không thể tải danh sách địa chỉ.</p>}
              {addressesStatus === "ready" && addresses.length === 0 && <p className="empty-summary">Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ để tiếp tục đặt lịch.</p>}
              <div className="address-options">{addresses.map(item => <button key={item.id} className={`address-option ${activeAddress?.id === item.id ? "selected" : ""}`} onClick={() => setSelectedAddress(item.id)}><span className="radio-dot">{activeAddress?.id === item.id && <i />}</span>{item.label === "Nhà riêng" ? <Home /> : <MapPin />}<span><strong>{item.label}</strong><small>{item.recipientName} · {item.phone}</small><small>{formatAddress(item)}</small></span>{item.isDefault && <span className="default-tag">Mặc định</span>}</button>)}</div>
            </>}
          {!form.inStore && deliveryFetch.status === "loading" && <p className="empty-summary" role="status">Đang tính phí giao nhận...</p>}
          {!form.inStore && deliveryFetch.status === "error" && <div className="empty-summary" role="alert"><p>{deliveryFetch.error}</p><button type="button" className="text-link" onClick={() => setDeliveryReloadToken((value) => value + 1)}>Tính lại phí giao nhận</button></div>}
          <label className="field-label note-field">Ghi chú cho cửa hàng (không bắt buộc)<textarea maxLength={255} value={form.note} onChange={e => form.setNote(e.target.value)} placeholder="Ví dụ: gọi điện trước khi đến, giao tại sảnh..." rows={3} /></label>
        </div>}

        {step === 3 && <div className="panel"><div className="panel-heading"><div><h2><CheckCircle2 /> Xác nhận đặt lịch</h2><p>Kiểm tra lại thông tin trước khi đặt.</p></div></div>
          <div className="booking-review"><h3>Thông tin đặt lịch</h3>
            <div><span>Cửa hàng</span><strong>{storeData?.name ?? "—"}</strong></div>
            <div><span>Dịch vụ</span><strong>{service ? `${service.name} · ${serviceQuantity(service, form.weight, form.items)} ${unitLabel(service)}` : "—"}</strong></div>
            <div><span>{form.inStore ? "Thời gian mang đồ đến" : "Thời gian lấy đồ"}</span><strong>{formatStoreDate(`${form.date}T00:00`)}{slot ? ` · ${slot}` : ""}</strong></div>
            <div><span>Hình thức</span><strong>{form.inStore ? "Tự mang đến cửa hàng" : "Cửa hàng đến lấy & giao tận nơi"}</strong></div>
            {!form.inStore && <div><span>Địa chỉ</span><strong>{activeAddress ? `${activeAddress.label}, ${formatAddress(activeAddress)}` : "Chưa chọn địa chỉ"}</strong></div>}
            {form.note.trim() && <div><span>Ghi chú</span><strong>{form.note.trim()}</strong></div>}
          </div>
          <div className="deposit-note"><CircleHelp /><div><strong>Thanh toán</strong><p>Đơn mới ở trạng thái "Chờ thanh toán" và sẽ tự hủy nếu quá thời gian giữ chỗ. Cửa hàng xác nhận giá cuối cùng sau khi cân/kiểm tra đồ.</p></div></div>
          {quoteFetch.status === "error" && <p className="empty-summary" role="alert">{quoteFetch.error}</p>}
        </div>}

        <div className="booking-actions">{step > 1 ? <button className="outline-button" onClick={() => setStep(step - 1)} disabled={submitting}>Quay lại</button> : <span className="booking-hint"><CheckCircle2 size={15} /> Không mất phí khi đặt lịch</span>}{step < 3 ? <button className="primary-button" disabled={!canContinue} onClick={() => setStep(step + 1)}>Tiếp tục <ArrowRight size={16} /></button> : <button className="primary-button" disabled={!input || quoteFetch.status !== "ready" || !validOrderAmount || submitting} onClick={() => void submit()}><CheckCircle2 size={17} /> {submitting ? "Đang đặt lịch..." : "Xác nhận đặt lịch"}</button>}</div>
      </div>

      <aside className="booking-summary"><div className="summary-title"><h3>Tóm tắt đơn hàng</h3><span className="summary-bag"><Package /></span></div>
        <div className="summary-store"><span className="summary-store-icon"><WashingMachine /></span><div><strong>{storeData?.name ?? "Chưa chọn cửa hàng"}</strong>{storeData?.distance && <small><MapPin size={12} /> {storeData.distance} từ vị trí của bạn</small>}</div></div>
        <div className="summary-lines">{service && serviceQuantity(service, form.weight, form.items) > 0
          ? <div className="summary-line"><span>{service.name} <small>× {serviceQuantity(service, form.weight, form.items)} {unitLabel(service)}</small></span><strong>{formatMoney(estimate)}</strong></div>
          : <div className="empty-summary">Chọn dịch vụ và nhập khối lượng để xem tạm tính.</div>}</div>
        <div className="summary-coupon"><Tag /><input value={form.promoInput} onChange={e => form.setPromoInput(e.target.value)} placeholder="Mã ưu đãi" maxLength={30} /><button onClick={() => form.setAppliedPromo(form.promoInput.trim().toUpperCase())} disabled={form.promoInput.trim().toUpperCase() === form.appliedPromo}>Áp dụng</button></div>
        {form.appliedPromo && <div className="summary-footnote"><CheckCircle2 size={15} /> Mã {form.appliedPromo}{step === 3 ? (quote ? ` giảm ${formatMoney(quote.discount_amount)}` : "") : " sẽ được kiểm tra ở bước xác nhận"}. <button className="text-link" onClick={() => { form.setAppliedPromo(""); form.setPromoInput(""); }}>Bỏ mã</button></div>}
        <div className="summary-total"><span>Tạm tính</span><strong>{formatMoney(quote ? quote.subtotal : estimate)}</strong></div>
        <div className="summary-total"><span>Phí giao nhận</span><strong>{deliveryFee != null ? formatMoney(deliveryFee) : deliveryFetch.status === "loading" ? "Đang tính..." : deliveryFetch.status === "error" ? "Không thể tính phí" : "Chưa tính"}</strong></div>
        <div className="summary-total"><span>Ưu đãi</span><strong className="discount-text">-{formatMoney(quote?.discount_amount ?? 0)}</strong></div>
        <div className="summary-grand"><span>Tổng tạm tính</span><strong>{step >= 2 && !deliveryReady && !quote ? "Chưa tính đủ phí giao nhận" : formatMoney(totalEstimate)}</strong></div>
        {service && !validOrderAmount && <div className="summary-footnote summary-minimum-order" role="status">{MIN_ORDER_MESSAGE}</div>}
        {quote && <div className="summary-footnote summary-slot-note"><CheckCircle2 size={15} /><span>Khung giờ này còn {quote.slots_left} chỗ{quote.estimated_delivery_at ? ` · Dự kiến hoàn thành: ${formatStoreDate(quote.estimated_delivery_at)} lúc ${formatStoreTime(quote.estimated_delivery_at)}` : ""}.</span></div>}
        <div className="summary-footnote summary-final-price"><CheckCircle2 size={15} /> Giá cuối cùng được xác nhận sau khi cửa hàng kiểm tra đồ.</div>
        <div className="summary-support"><CircleHelp /><span>Cần hỗ trợ?<strong>1900 1234</strong></span></div>
      </aside>
    </div>
  </>;
}
