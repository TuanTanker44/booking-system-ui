import { useEffect, useMemo, useState } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { LocationPermissionDialog } from "../../components/customer/LocationPermissionDialog";
import { Avatar } from "../../components/common/Avatar";
import { CustomerAccountMenu } from "../../components/customer/CustomerAccountMenu";
import { useUserStore } from "../../stores/user.js";
import { AuthService } from "../../services/auth";
import { userService, type UpdateUserPayload } from "../../services/user";
import type { User } from "../../types/user";
import { useFetched } from "../../hooks/useFetched.js";
import { GlobalSearch } from "../../components/customer/GlobalSearch";
import type { SearchEntry } from "../../lib/search";
import { getTopSellingStores, getTopSellingStoresByArea } from "../../services/store";
import type { ApiStore, TopSellingStore } from "../../types/store";
import { getCurrentCoordinates, parseAddressParts, parseCurrentLocation, reverseGeocode } from "../../lib/location";
import { getErrorMessage } from "../../lib/error";
import { isPasswordValid, PASSWORD_RULES } from "../../lib/password";
import { ACTIVE_STATUSES, BOOKING_STATUS_LABELS, BookingService } from "../../services/booking";
import type { Booking } from "../../types/booking";
import { BookingPage } from "./BookingPage";
import { useBookingForm } from "../../hooks/useBookingForm.js";
import { OrdersPage } from "./OrdersPage";
import { PageHeading } from "./PageHeading";
import { formatMoney } from "./format";
import { PaymentCheckout } from "./PaymentCheckout";
import { PaymentService } from "../../services/payment";
import type { CreatePaymentResponse, OnlinePaymentMethod } from "../../types/payment";
import { DEFAULT_CITY, CITIES, getDistricts, getWards, matchName, stripAdminPrefix } from "../../lib/vn-address";
import { AddressService, formatAddress } from "../../services/address";
import type { Address, AddressInput } from "../../types/address";
import {
  MapPin, Home, CalendarDays, Package, MapPinned, UserRound, Settings,
  Bell, ChevronDown, ChevronRight, Plus, Clock3, Star, Truck,
  CheckCircle2, WashingMachine, Shirt, Sparkles, WalletCards, X,
  ArrowRight, CircleHelp, LogOut, Check, Eye, EyeOff, LockKeyhole, ShieldCheck,
  BedDouble, Footprints, LocateFixed, Phone, Pencil, Trash2, BadgeCheck,
} from "lucide-react";

type Page = "home" | "booking" | "orders" | "addresses" | "profile";
type Service = { id: number; name: string; description: string; price: number; unit: string; icon: "wash" | "shirt" | "bed" | "shoe" };

const services: Service[] = [
  { id: 1, name: "Giặt theo kg", description: "Giặt sấy thường ngày", price: 15000, unit: "kg", icon: "wash" },
  { id: 2, name: "Giặt hấp cao cấp", description: "Chăm sóc vải chuyên biệt", price: 35000, unit: "kg", icon: "shirt" },
  { id: 3, name: "Giặt chăn ga gối", description: "Làm sạch sâu, khử mùi", price: 50000, unit: "món", icon: "bed" },
  { id: 4, name: "Đồ dễ giặt đặc biệt", description: "Giày, thú bông và đồ khác", price: 20000, unit: "món", icon: "shoe" },
];

type StoreItem = { id: number; phone: string; name: string; distance?: string; time?: string; rating?: number; reviews?: number; completedBookings?: number; address: string };

const toStoreItem = (store: TopSellingStore): StoreItem => ({
  id: store.id, name: store.name, address: store.address, phone: store.phone ?? "", completedBookings: store.completedBookings,
});

const serviceIcons: Record<Service["icon"], React.ReactNode> = {
  wash: <WashingMachine />,
  shirt: <Shirt />,
  bed: <BedDouble />,
  shoe: <Footprints />,
};
const iconFor = (icon: Service["icon"]) => serviceIcons[icon];

export function CustomerDashboardPage() {
  const navigateRoute = useRouterNavigate();
  const user = useUserStore((state) => state.user);
  const displayName = user?.fullName || user?.email || "Khách hàng";
  const [page, setPage] = useState<Page>("home");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Booking[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersStatus, setOrdersStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activeOrder, setActiveOrder] = useState<number | null>(null);
  const bookingForm = useBookingForm();
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  // Dịch vụ khách chọn ở trang chủ / tìm kiếm, chờ BookingPage tìm dịch vụ tương ứng của cửa hàng
  const [requestedServiceName, setRequestedServiceName] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [detectedAddress, setDetectedAddress] = useState("");
  // currentLocation { ward, district, city } suy ra từ detectedAddress
  const currentLocation = useMemo(() => detectedAddress ? parseCurrentLocation(detectedAddress) : null, [detectedAddress]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesStatus, setAddressesStatus] = useState<"loading" | "ready" | "error">("loading");

  const reloadAddresses = async () => {
    try {
      setAddresses(await AddressService.list());
      setAddressesStatus("ready");
    } catch {
      setAddressesStatus("error");
    }
  };

  useEffect(() => {
    let cancelled = false;

    AddressService.list()
      .then((result) => {
        if (cancelled) return;
        setAddresses(result);
        setAddressesStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setAddressesStatus("error");
      });

    return () => { cancelled = true; };
  }, []);

  // Đơn hàng của tôi (100 đơn mới nhất)
  const reloadOrders = async () => {
    try {
      const result = await BookingService.listMine({ limit: 100 });
      setOrders(result.data);
      setOrdersTotal(result.meta.total);
      setOrdersStatus("ready");
    } catch {
      setOrdersStatus("error");
    }
  };

  useEffect(() => {
    let cancelled = false;

    BookingService.listMine({ limit: 100 })
      .then((result) => {
        if (cancelled) return;
        setOrders(result.data);
        setOrdersTotal(result.meta.total);
        setOrdersStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setOrdersStatus("error");
      });

    return () => { cancelled = true; };
  }, []);

  const [stores, setStores] = useState<StoreItem[]>([]);
  const [storesStatus, setStoresStatus] = useState<"loading" | "ready" | "error">("loading");

  // Cửa hàng bán chạy: theo khu vực nếu đã có vị trí, ngược lại lấy danh sách chung
  useEffect(() => {
    const controller = new AbortController();

    async function loadStores() {
      try {
        let result = currentLocation && currentLocation.city
          ? await getTopSellingStoresByArea(currentLocation, controller.signal)
          : [];

        // Chưa có vị trí, hoặc khu vực đó chưa có cửa hàng: dùng danh sách bán chạy chung
        if (result.length === 0) result = await getTopSellingStores(controller.signal);

        setStores(result.map(toStoreItem));
        setStoresStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStoresStatus("error");
      }
    }

    void loadStores();
    return () => controller.abort();
  }, [currentLocation]);

  const navigate = (next: Page) => {
    setPage(next);
    // Rời khỏi đặt lịch thì bỏ yêu cầu chọn dịch vụ chưa xử lý xong
    if (next !== "booking") setRequestedServiceName(null);
    setActiveOrder(null);
    // Rời trang thì bỏ phiên thanh toán đang mở (đơn vẫn ở trạng thái chờ thanh toán)
    setCheckoutBooking(null);
    setCheckoutPayment(null);
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  // Đặt lịch thành công: tải lại danh sách đơn rồi mở chi tiết đơn vừa tạo
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [checkoutPayment, setCheckoutPayment] = useState<CreatePaymentResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<OnlinePaymentMethod>("vnpay");
  const [creatingPayment, setCreatingPayment] = useState(false);
  // Lỗi tạo giao dịch hiển thị ngay trong hộp thoại (toast dễ bị bỏ lỡ)
  const [paymentError, setPaymentError] = useState("");
  const onBookingCreated = (booking: Booking) => {
    void reloadOrders();

    setActiveOrder(booking.id);
    setCheckoutBooking(booking);
    setCheckoutPayment(null);
    setPaymentError("");
    setPage("orders");

    notify("Đặt lịch thành công! Vui lòng chọn phương thức thanh toán.");
  };

  const startPayment = async (method: OnlinePaymentMethod) => {
    if (!checkoutBooking || creatingPayment) return;

    setCreatingPayment(true);
    setPaymentError("");

    try {
      // PaymentService.create đã trả sẵn dữ liệu giao dịch (gồm payment_url và qr_code_url)
      const payment = await PaymentService.create({
        booking_id: checkoutBooking.id,
        method,
      });

      setCheckoutPayment(payment);
      setPaymentMethod(method);

      notify("Đã tạo giao dịch. Vui lòng hoàn tất thanh toán.");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Không thể tạo giao dịch thanh toán. Vui lòng thử lại.");
      setPaymentError(message);
      notify(message);
    } finally {
      setCreatingPayment(false);
    }
  };

  // Backend xác nhận đã thanh toán: làm mới danh sách đơn để trạng thái chuyển khỏi "Chờ thanh toán"
  const onPaymentSuccess = () => {
    void reloadOrders();
    notify("Thanh toán thành công!");
  };

  // Giao diện thanh toán chỉ hiện trong chi tiết đúng đơn vừa đặt, ngay dưới panel theo dõi đơn
  const renderPayment = (orderId: number) =>
    checkoutBooking && checkoutPayment && checkoutBooking.id === orderId ? (
      <PaymentCheckout
        payment={checkoutPayment}
        bookingId={checkoutBooking.id}
        bookingCode={checkoutBooking.booking_code}
        onBack={() => setCheckoutPayment(null)}
        onPaid={onPaymentSuccess}
        onClose={closeCheckout}
      />
    ) : null;

  // Mở chi tiết đơn đang chờ thanh toán mà backend còn giao dịch dùng được (đang chờ, chưa hết hạn): tự hiện lại QR
  useEffect(() => {
    if (activeOrder === null || checkoutBooking?.id === activeOrder) return;

    const order = orders.find(item => item.id === activeOrder);
    if (!order || order.status !== "pending_payment") return;

    let cancelled = false;

    PaymentService.listByBooking(order.id)
      .then((payments) => {
        if (cancelled) return;

        // Danh sách mới nhất trước; backend chỉ trả payment_url / expires_at cho giao dịch còn dùng được
        for (const item of payments) {
          if (item.method === "cash" || !item.payment_url || !item.expires_at) continue;

          setPaymentMethod(item.method);
          setCheckoutBooking(order);
          setCheckoutPayment({
            payment_id: item.id,
            method: item.method,
            amount: item.amount,
            payment_url: item.payment_url,
            qr_code_url: item.qr_code_url,
            expires_at: item.expires_at,
          });
          return;
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [activeOrder, orders, checkoutBooking]);

  const closeCheckout = () => {
    setCheckoutPayment(null);
    setCheckoutBooking(null);
  };

  // Dữ liệu cho ô tìm kiếm: tên, địa chỉ, mô tả, số điện thoại
  const searchEntries = useMemo<SearchEntry[]>(() => [
    ...services.map(service => ({
      id: `service-${service.id}`, type: "service" as const, title: service.name,
      subtitle: `${formatMoney(service.price)}/${service.unit}`,
      fields: [{ label: "Mô tả", value: service.description }],
    })),
    ...addresses.map(item => ({
      id: `address-${item.id}`, type: "address" as const, title: `${item.label} · ${item.recipientName}`, subtitle: formatAddress(item),
      fields: [{ label: "Địa chỉ", value: formatAddress(item) }, { label: "SĐT", value: item.phone, kind: "phone" as const }],
    })),
    ...orders.map(order => ({
      id: `order-${order.id}`, type: "order" as const, title: `Đơn ${order.booking_code}`, subtitle: `${order.service_name} · ${BOOKING_STATUS_LABELS[order.status]}`,
      fields: [{ label: "Dịch vụ", value: order.service_name }, { label: "Mã đơn", value: order.booking_code }],
    })),
  ], [addresses, orders]);
  // Mở đặt lịch từ trang chủ / tìm kiếm với cửa hàng hoặc dịch vụ đã chọn sẵn, quay về bước 1
  const startBooking = ({ storeId, serviceName }: { storeId?: number; serviceName?: string } = {}) => {
    if (storeId !== undefined) {
      // Dịch vụ thuộc từng cửa hàng: đổi cửa hàng thì bỏ dịch vụ đã chọn trước đó
      if (storeId !== (selectedStore ?? stores[0]?.id)) bookingForm.setServiceId(null);
      setSelectedStore(storeId);
    }
    setRequestedServiceName(serviceName ?? null);
    bookingForm.setStep(1);
    navigate("booking");
  };
  // Chọn cửa hàng từ kết quả API: thêm vào danh sách (nếu chưa có) rồi mở đặt lịch
  const selectApiStore = (store: ApiStore) => {
    setStores(current => current.some(item => item.id === store.id) ? current : [{
      id: store.id, name: store.name, address: store.address, phone: store.phone ?? "",
      distance: store.distance_km != null ? `${String(store.distance_km).replace(".", ",")} km` : undefined,
    }, ...current]);
    startBooking({ storeId: store.id });
  };
  const selectSearchEntry = (entry: SearchEntry, store?: ApiStore) => {
    const key = entry.id.slice(entry.id.indexOf("-") + 1);
    if (entry.type === "store") {
      if (store) selectApiStore(store);
    } else if (entry.type === "service") {
      const service = services.find(
        item => item.id === Number(key),
      );

      startBooking({ serviceName: service?.name });
    } else if (entry.type === "address") {
      navigate("addresses");
    } else {
      navigate("orders");
      setActiveOrder(Number(key));
    }
  };

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Trang chủ", icon: <Home /> },
    { id: "booking", label: "Đặt lịch giặt", icon: <CalendarDays /> },
    { id: "orders", label: "Đơn hàng của tôi", icon: <Package /> },
    { id: "addresses", label: "Địa chỉ", icon: <MapPinned /> },
    { id: "profile", label: "Tài khoản", icon: <UserRound /> },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><WashingMachine size={23} /></span>
          <span>Laundry<span className="brand-blue">Booking</span><small>GIẶT SẠCH, SỐNG NHẸ</small></span>
        </div>
        <div className="sidebar-label">MENU CHÍNH</div>
        <nav className="side-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
              {item.icon}<span>{item.label}</span>{item.id === "orders" && <span className="nav-count">{orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-promo">
          <div className="promo-icon"><Sparkles size={19} /></div>
          <strong>Giặt sạch, tiết kiệm hơn!</strong>
          <p>Nhận ưu đãi 20% cho đơn hàng đầu tiên.</p>
          <button onClick={() => navigate("booking")}>Đặt lịch ngay <ArrowRight size={14} /></button>
          <div className="promo-bubbles" />
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => navigateRoute("/help")}><CircleHelp /><span>Trợ giúp & hỗ trợ</span></button>
          <div className="sidebar-user"><Avatar className="avatar" name={displayName} src={user?.avatarUrl} /><div><strong>{displayName}</strong><small>Khách hàng</small></div><ChevronDown size={16} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Khách hàng</span><ChevronRight size={14} /><strong>{navItems.find(item => item.id === page)?.label || "Trang chủ"}</strong></div>
          <GlobalSearch entries={searchEntries} onSelect={selectSearchEntry} />
          <div className="topbar-actions">
            <button className="icon-button notification-button" aria-label="Thông báo" onClick={() => notify("Bạn đã xem các thông báo mới nhất.")}><Bell /><i /></button>
            <div className="topbar-divider" />
            <CustomerAccountMenu onProfile={() => navigate("profile")} />
          </div>
        </header>

        <div className="page-content">
          {page === "home" && (<HomePage navigate={navigate} setSearch={setSearch} stores={stores} storesStatus={storesStatus} detectedAddress={detectedAddress} onSelectService={service => startBooking({ serviceName: service.name })} onSelectStore={store => startBooking({ storeId: store.id })} />)}
          {page === "booking" && <BookingPage form={bookingForm} stores={stores} selectedStore={selectedStore} setSelectedStore={setSelectedStore} addresses={addresses} addressesStatus={addressesStatus} goToAddresses={() => navigate("addresses")} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} notify={notify} onCreated={onBookingCreated} requestedServiceName={requestedServiceName} onRequestedServiceHandled={() => setRequestedServiceName(null)} />}
          {page === "orders" && <OrdersPage orders={orders} total={ordersTotal} status={ordersStatus} reload={reloadOrders} search={search} setSearch={setSearch} activeOrder={activeOrder} setActiveOrder={setActiveOrder} navigate={navigate} addresses={addresses} notify={notify} renderPayment={renderPayment} />}
          {page === "addresses" && <AddressesPage notify={notify} addresses={addresses} status={addressesStatus} reload={reloadAddresses} />}
          {page === "profile" && <ProfilePage notify={notify} addresses={addresses} addressesStatus={addressesStatus} goToAddresses={() => navigate("addresses")} />}
        </div>
        <footer className="footer"><span>© 2026 Laundry Booking</span><span>Giặt sạch mỗi ngày, nhẹ nhàng cuộc sống <span className="footer-heart">♥</span></span></footer>
      </main>
      {checkoutBooking && !checkoutPayment && (
        <div className="payment-method-overlay">
          <section className="payment-method-dialog">
            <button
              type="button"
              className="icon-button"
              aria-label="Đóng"
              onClick={() => setCheckoutBooking(null)}
              disabled={creatingPayment}
            >
              <X />
            </button>

            <h2>Chọn phương thức thanh toán</h2>
            <p>
              Đơn hàng <strong>{checkoutBooking.booking_code}</strong>
            </p>

            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="vnpay"
                checked={paymentMethod === "vnpay"}
                onChange={() => setPaymentMethod("vnpay")}
                disabled={creatingPayment}
              />
              <span>VNPay</span>
            </label>

            {/* Tạm ẩn MoMo, chỉ hỗ trợ VNPay */}

            {paymentError && <p className="payment-method-error" role="alert">{paymentError}</p>}
            <button
              type="button"
              className="primary-button"
              disabled={creatingPayment}
              onClick={() => void startPayment(paymentMethod)}
            >
              {creatingPayment ? "Đang tạo giao dịch..." : "Tiếp tục thanh toán"}
            </button>

            <button
              type="button"
              className="outline-button"
              disabled={creatingPayment}
              onClick={() => setCheckoutBooking(null)}
            >
              Thanh toán sau
            </button>
          </section>
        </div>
      )}

      <nav className="mobile-bottom-nav">
        {[
          { id: "home" as Page, label: "Trang chủ", icon: <Home /> },
          { id: "booking" as Page, label: "Đặt lịch", icon: <CalendarDays /> },
          { id: "orders" as Page, label: "Đơn hàng", icon: <Package /> },
          { id: "addresses" as Page, label: "Địa chỉ", icon: <MapPin /> },
          { id: "profile" as Page, label: "Tài khoản", icon: <UserRound /> },
        ].map(item => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => navigate(item.id)}>{item.icon}<span>{item.label}</span></button>)}
      </nav>
      <LocationPermissionDialog onAddressDetected={setDetectedAddress} notify={notify} />
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function HomePage({ navigate, setSearch, stores, storesStatus, detectedAddress, onSelectService, onSelectStore }: { navigate: (page: Page) => void; setSearch: (value: string) => void; stores: StoreItem[]; storesStatus: "loading" | "ready" | "error"; detectedAddress: string; onSelectService: (service: Service) => void; onSelectStore: (store: StoreItem) => void }) {
  // Đã có vị trí người dùng: hiện địa chỉ thay cho ô nhập, cho phép đổi sang nhập tay
  const [editingLocation, setEditingLocation] = useState(false);
  const showDetected = Boolean(detectedAddress) && !editingLocation;
  return <>
    <section className="hero">
      <div className="hero-copy">
        <div className="hero-kicker"><Sparkles size={14} /> DỊCH VỤ GIẶT ỦI THÔNG MINH</div>
        <h1>Giặt sạch dễ dàng,<br /><span>cuộc sống nhẹ nhàng.</span></h1>
        <p>Đặt lịch giặt online, giao nhận tận nơi. Dành thời gian cho những điều bạn yêu thích.</p>
        <div className="hero-search">
          <MapPin size={18} />{showDetected ? <><span className="hero-location" title={detectedAddress}>{detectedAddress}</span><button type="button" className="hero-location-change" onClick={() => setEditingLocation(true)}>Thay đổi</button></> : <input aria-label="Tìm địa chỉ" placeholder="Nhập khu vực hoặc địa chỉ của bạn" defaultValue={editingLocation ? detectedAddress : ""} onChange={e => setSearch(e.target.value)} />}<button onClick={() => navigate("booking")}>Đặt lịch ngay <ArrowRight size={16} /></button>
        </div>
        <div className="hero-trust"><span><CheckCircle2 /> Đúng giờ, đúng hẹn</span><span><BadgeCheck /> Chăm sóc tận tâm</span></div>
      </div>
      <div className="hero-visual">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="laundry-art"><div className="washer"><div className="washer-top" /><div className="washer-screen" /><div className="washer-door"><div /></div></div><div className="towel towel-blue" /><div className="towel towel-white" /><div className="laundry-basket"><div className="basket-cloth" /><div className="basket-body"><span /><span /><span /><span /></div></div><div className="floating-bubble bubble-a"><Sparkles /></div><div className="floating-bubble bubble-b"><Check /></div></div>
        <div className="hero-note"><span className="note-icon"><Truck /></span><div><strong>Giao nhận tận nhà</strong><small>Miễn phí với đơn từ 150.000đ</small></div></div>
      </div>
      <div className="hero-decoration" />
    </section>

    <section className="benefit-strip">
      <div><span className="benefit-icon blue-bg"><Truck /></span><div><strong>Giao nhận tận nơi</strong><small>Tiện lợi, tiết kiệm thời gian</small></div></div>
      <div><span className="benefit-icon mint-bg"><BadgeCheck /></span><div><strong>Giặt sạch an toàn</strong><small>Quy trình chăm sóc chuyên nghiệp</small></div></div>
      <div><span className="benefit-icon purple-bg"><Clock3 /></span><div><strong>Đúng giờ, đúng hẹn</strong><small>Theo dõi trạng thái đơn hàng</small></div></div>
      <div><span className="benefit-icon orange-bg"><WalletCards /></span><div><strong>Thanh toán linh hoạt</strong><small>Nhiều phương thức tiện lợi</small></div></div>
    </section>

    <section className="section-block">
      <div className="section-title"><div><span className="eyebrow">DỊCH VỤ CỦA CHÚNG TÔI</span><h2>Chọn dịch vụ phù hợp</h2><p>Chăm sóc từng món đồ theo cách tốt nhất.</p></div><button className="text-link" onClick={() => navigate("booking")}>Tất cả dịch vụ <ArrowRight size={16} /></button></div>
      <div className="service-grid">{services.map((service, index) => <button className="service-card" key={service.id} onClick={() => onSelectService(service)}><div className={`service-art art-${index + 1}`}>{iconFor(service.icon)}</div><span className={`service-deco art-${index + 1}`} aria-hidden="true">{iconFor(service.icon)}</span><h3>{service.name}</h3><p>{service.description}</p><div className="service-price"><strong>{formatMoney(service.price)}</strong><span>/{service.unit}</span><ArrowRight size={16} /></div></button>)}</div>
    </section>

    <section className="section-block store-section">
      <div className="section-title"><div><span className="eyebrow">GẦN BẠN</span><h2>Cửa hàng được yêu thích</h2><p>Chọn cửa hàng phù hợp với lịch trình của bạn.</p></div><button className="text-link" onClick={() => navigate("booking")}>Xem tất cả <ArrowRight size={16} /></button></div>
      {stores.length === 0 && <div className="empty-state"><WashingMachine /><strong>{storesStatus === "loading" ? "Đang tải cửa hàng..." : storesStatus === "error" ? "Không thể tải danh sách cửa hàng" : "Chưa có cửa hàng nào"}</strong></div>}
      <div className="store-grid">{stores.map((store, i) => <div className="store-card" key={store.id}><div className={`store-thumb store-thumb-${(i % 3) + 1}`}><div className="store-building"><span /><span /><span /><span /></div><span className="store-open"><i /> Đang mở cửa</span></div><div className="store-info"><div className="store-name-row"><h3>{store.name}</h3>{store.rating !== undefined && <span className="rating"><Star size={13} fill="currentColor" /> {store.rating}</span>}</div><p><MapPin size={14} /> {store.address}</p><div className="store-meta">{store.distance && <span><Truck size={14} /> {store.distance}</span>}{store.time && <span><Clock3 size={14} /> {store.time}</span>}{store.reviews !== undefined && <span>({store.reviews} đánh giá)</span>}{store.completedBookings !== undefined && <span>{store.completedBookings} đơn hoàn thành</span>}</div><button className="outline-button" onClick={() => onSelectStore(store)}>Chọn cửa hàng <ArrowRight size={15} /></button></div></div>)}</div>
    </section>

    <section className="bottom-cta"><div className="cta-spark cta-spark-one">✦</div><div className="cta-copy"><span className="eyebrow">BẮT ĐẦU NGAY HÔM NAY</span><h2>Để việc giặt giũ cho chúng tôi.</h2><p>Đặt lịch chỉ trong vài phút, nhận quần áo sạch thơm ngay tại nhà.</p><button className="white-button" onClick={() => navigate("booking")}>Đặt lịch giặt ngay <ArrowRight size={16} /></button></div><div className="cta-illustration"><div className="cta-shirt"><Shirt /></div><div className="cta-basket"><span /><span /><span /></div><div className="cta-spark cta-spark-two">✦</div></div></section>
  </>;
}

function AddressSelect({ value, options, placeholder, disabled, onChange }: { value: string; options: string[]; placeholder: string; disabled?: boolean; onChange: (value: string) => void }) {
  // Giữ giá trị đang có (vd. địa chỉ cũ không nằm trong danh mục) để không bị mất khi mở form sửa
  const items = value && !options.includes(value) ? [value, ...options] : options;
  return <select value={value} disabled={disabled} onChange={e => onChange(e.target.value)}><option value="">{placeholder}</option>{items.map(item => <option key={item} value={item}>{item}</option>)}</select>;
}

type AddressFormState = { label: string; recipientName: string; phone: string; addressLine: string; ward: string; district: string; city: string; latitude: string; longitude: string; isDefault: boolean };
const emptyAddressForm: AddressFormState = { label: "Nhà riêng", recipientName: "", phone: "", addressLine: "", ward: "", district: "", city: DEFAULT_CITY, latitude: "", longitude: "", isDefault: false };

function AddressesPage({ notify, addresses, status, reload }: { notify: (message: string) => void; addresses: Address[]; status: "loading" | "ready" | "error"; reload: () => Promise<void> }) {
  const user = useUserStore((state) => state.user);
  const [showForm, setShowForm] = useState(false);
  // null: đang thêm mới, số: đang sửa địa chỉ có id tương ứng
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressFormState>(emptyAddressForm);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const setField = <K extends keyof AddressFormState>(key: K, value: AddressFormState[K]) => setForm(current => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditingId(null);
    // Địa chỉ đầu tiên tự là mặc định
    setForm({ ...emptyAddressForm, recipientName: user?.fullName ?? "", phone: user?.phone ?? "", isDefault: addresses.length === 0 });
    setShowForm(true);
  };
  const openEdit = (item: Address) => {
    setEditingId(item.id);
    setForm({ label: item.label, recipientName: item.recipientName, phone: item.phone, addressLine: item.addressLine, ward: item.ward, district: item.district, city: item.city, latitude: item.latitude?.toString() ?? "", longitude: item.longitude?.toString() ?? "", isDefault: item.isDefault });
    setShowForm(true);
  };
  const closeForm = () => setShowForm(false);
  const districts = getDistricts(form.city);
  const wards = getWards(form.city, form.district);
  const changeCity = (city: string) => setForm(current => ({ ...current, city, district: "", ward: "" }));
  const changeDistrict = (district: string) => setForm(current => ({ ...current, district, ward: "" }));

  // Điền địa chỉ + tọa độ từ vị trí hiện tại của thiết bị
  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const coordinates = await getCurrentCoordinates();
      const parts = parseAddressParts(await reverseGeocode(coordinates));
      // Ưu tiên tên chuẩn trong danh mục; không khớp thì vẫn điền giá trị định vị để người dùng tự sửa
      const city = matchName([...CITIES], parts?.city ?? "") || stripAdminPrefix(parts?.city ?? "") || DEFAULT_CITY;
      const district = matchName(getDistricts(city), parts?.district ?? "") || stripAdminPrefix(parts?.district ?? "");
      const ward = matchName(getWards(city, district), parts?.ward ?? "") || stripAdminPrefix(parts?.ward ?? "");
      setForm(current => ({ ...current, latitude: coordinates.latitude.toString(), longitude: coordinates.longitude.toString(), addressLine: parts?.addressLine ?? current.addressLine, city, district, ward }));
      notify(parts ? "Đã điền địa chỉ từ vị trí hiện tại." : "Đã lấy tọa độ, vui lòng nhập địa chỉ.");
    } catch {
      notify("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.");
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    const input: AddressInput = { ...form, latitude: form.latitude.trim() ? Number(form.latitude) : null, longitude: form.longitude.trim() ? Number(form.longitude) : null, recipientName: form.recipientName.trim(), phone: form.phone.trim(), addressLine: form.addressLine.trim(), ward: form.ward.trim(), district: form.district.trim(), city: form.city.trim() };
    if (!input.recipientName || !input.phone || !input.addressLine || !input.ward || !input.district || !input.city) { notify("Vui lòng nhập đầy đủ thông tin địa chỉ."); return; }
    if (input.phone.replace(/\D/g, "").length < 9) { notify("Số điện thoại không hợp lệ."); return; }

    setSaving(true);
    try {
      if (editingId === null) await AddressService.create(input);
      else await AddressService.update(editingId, input);
      await reload();
      setShowForm(false);
      notify(editingId === null ? "Đã thêm địa chỉ mới." : "Đã cập nhật địa chỉ.");
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Không thể lưu địa chỉ. Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };
  const remove = async (item: Address) => {
    try {
      await AddressService.remove(item.id);
      await reload();
      notify("Đã xóa địa chỉ.");
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Không thể xóa địa chỉ. Vui lòng thử lại."));
    }
  };
  const makeDefault = async (item: Address) => {
    try {
      await AddressService.setDefault(item.id);
      await reload();
      notify("Đã đặt địa chỉ mặc định.");
    } catch (err: unknown) {
      notify(getErrorMessage(err, "Không thể đặt địa chỉ mặc định. Vui lòng thử lại."));
    }
  };

  return <>
    <PageHeading eyebrow="SỔ ĐỊA CHỈ" title="Địa chỉ của tôi" description="Quản lý địa chỉ lấy và giao đồ giặt của bạn." action={<button className="primary-button" onClick={openCreate}><Plus size={17} /> Thêm địa chỉ</button>} />
    {showForm && <div className="panel address-form"><div className="panel-heading"><div><h2><MapPinned /> {editingId === null ? "Thêm địa chỉ mới" : "Chỉnh sửa địa chỉ"}</h2><p>Thông tin này sẽ được dùng khi đặt lịch lấy và giao đồ.</p></div><button className="icon-button" onClick={closeForm} aria-label="Đóng"><X /></button></div><div className="form-grid"><label className="field-label">Tên địa chỉ<select value={form.label} onChange={e => setField("label", e.target.value)}><option>Nhà riêng</option><option>Cơ quan</option><option>Khác</option></select></label><label className="field-label">Người nhận<input value={form.recipientName} onChange={e => setField("recipientName", e.target.value)} placeholder="Họ và tên người nhận" /></label><label className="field-label">Số điện thoại<input type="tel" value={form.phone} onChange={e => setField("phone", e.target.value)} placeholder="09xx xxx xxx" /></label><label className="field-label field-span">Số nhà, tên đường<input value={form.addressLine} onChange={e => setField("addressLine", e.target.value)} placeholder="Ví dụ: Số 123, đường Xuân Thủy" /></label><label className="field-label">Tỉnh/Thành phố<AddressSelect value={form.city} options={[...CITIES]} placeholder="Chọn tỉnh/thành phố" onChange={changeCity} /></label><label className="field-label">Quận/Huyện<AddressSelect value={form.district} options={districts} placeholder="Chọn quận/huyện" disabled={!form.city} onChange={changeDistrict} /></label><label className="field-label">Phường/Xã{wards.length > 0 || !form.district ? <AddressSelect value={form.ward} options={wards} placeholder="Chọn phường/xã" disabled={!form.district} onChange={ward => setField("ward", ward)} /> : <input value={form.ward} onChange={e => setField("ward", e.target.value)} placeholder="Nhập phường/xã" />}</label><div className="field-label"><span>Vị trí trên bản đồ</span><button type="button" className="outline-button" onClick={useCurrentLocation} disabled={locating}><LocateFixed size={16} /> {locating ? "Đang định vị..." : form.latitude !== "" ? "Cập nhật vị trí hiện tại" : "Dùng vị trí hiện tại"}</button>{form.latitude !== "" && form.longitude !== "" && <small>{form.latitude}, {form.longitude}</small>}</div>{editingId === null && <>
      <label className="field-label">Vĩ độ (tùy chọn)
        <input type="text" inputMode="decimal" value={form.latitude} onChange={e => setField("latitude", e.target.value)} placeholder="Ví dụ: 21.02851" disabled={saving || locating} />
      </label>
      <label className="field-label">Kinh độ (tùy chọn)
        <input type="text" inputMode="decimal" value={form.longitude} onChange={e => setField("longitude", e.target.value)} placeholder="Ví dụ: 105.80482" disabled={saving || locating} />
      </label>
      <p className="field-span">Nếu không dùng vị trí hiện tại, bạn có thể nhập tọa độ của địa chỉ từ bản đồ. Hãy nhập cả vĩ độ (-90 đến 90) và kinh độ (-180 đến 180), dùng dấu chấm cho phần thập phân.</p>
    </>}<label className="field-span checkbox-field"><input type="checkbox" checked={form.isDefault} onChange={e => setField("isDefault", e.target.checked)} /> Đặt làm địa chỉ mặc định</label></div><div className="form-actions"><button className="outline-button" onClick={closeForm} disabled={saving}>Hủy</button><button className="primary-button" onClick={save} disabled={saving}><Check size={16} /> {saving ? "Đang lưu..." : "Lưu địa chỉ"}</button></div></div>}
    {status === "loading" && <p>Đang tải địa chỉ...</p>}
    {status === "error" && <p>Không thể tải danh sách địa chỉ. <button className="outline-button" onClick={() => void reload()}>Thử lại</button></p>}
    <div className="address-page-grid">{addresses.map(item => <div className="panel address-card" key={item.id}><div className="address-card-top"><span className="address-large-icon">{item.label === "Nhà riêng" ? <Home /> : <MapPin />}</span><div className="address-title"><h3>{item.label}</h3>{item.isDefault && <span className="default-tag">Mặc định</span>}</div></div><div className="address-recipient"><strong>{item.recipientName}</strong><span><Phone size={14} /> {item.phone}</span></div><p className="address-full"><MapPin size={15} />{formatAddress(item)}</p><div className="address-card-actions"><button onClick={() => openEdit(item)}><Pencil size={15} /> Chỉnh sửa</button><button onClick={() => void remove(item)}><Trash2 size={15} /> Xóa</button>{!item.isDefault && <button onClick={() => void makeDefault(item)}><CheckCircle2 size={15} /> Đặt mặc định</button>}</div></div>)}
      <button className="add-address-card" onClick={openCreate}><span><Plus /></span><strong>Thêm địa chỉ mới</strong><small>Lưu địa chỉ để đặt lịch nhanh hơn</small></button></div>
    <div className="address-tip"><LocateFixed /><div><strong>Mẹo nhỏ</strong><p>Hãy nhập địa chỉ càng chi tiết càng tốt để shipper tìm bạn nhanh hơn. Bấm "Dùng vị trí hiện tại" để lưu tọa độ chính xác hơn.</p></div></div>
  </>;
}

// Tải thông tin người dùng từ API getMe; form chỉ được dựng sau khi có dữ liệu
type ProfileExtras = { addresses: Address[]; addressesStatus: "loading" | "ready" | "error"; goToAddresses: () => void };

function ProfilePage({ notify, addresses, addressesStatus, goToAddresses }: { notify: (message: string) => void } & ProfileExtras) {
  const [version, setVersion] = useState(0);
  const { status, data: user } = useFetched("profile", () => AuthService.getMe(), version);
  if (!user) {
    return <>
      <PageHeading eyebrow="TÀI KHOẢN CỦA BẠN" title="Thông tin cá nhân" description="Cập nhật thông tin để chúng tôi phục vụ bạn tốt hơn." />
      <div className="panel"><div className="empty-state"><UserRound />
        {status === "error" ? <><strong>Không thể tải thông tin cá nhân</strong><button className="outline-button" onClick={() => setVersion(v => v + 1)}>Thử lại</button></> : <strong>Đang tải thông tin cá nhân...</strong>}
      </div></div>
    </>;
  }
  return <ProfileContent user={user} notify={notify} addresses={addresses} addressesStatus={addressesStatus} goToAddresses={goToAddresses} />;
}

function ProfileContent({ user, notify, addresses, addressesStatus, goToAddresses }: { user: User; notify: (message: string) => void } & ProfileExtras) {
  const navigate = useRouterNavigate();
  // Địa chỉ mặc định lấy từ danh sách địa chỉ đã lưu; nếu chưa đặt mặc định thì dùng địa chỉ đầu tiên
  const defaultAddress = addresses.find(item => item.isDefault) ?? addresses[0];
  const defaultAddressText = defaultAddress ? formatAddress(defaultAddress)
    : addressesStatus === "loading" ? "Đang tải địa chỉ..."
    : addressesStatus === "error" ? "Không thể tải địa chỉ"
    : "Chưa có địa chỉ nào";
  const displayName = user?.fullName || user?.email || "Khách hàng";
  const [name, setName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"info" | "password">("info");
  const handleLogout = async () => {
    // store.logout luôn xóa phiên phía client dù server báo lỗi
    await useUserStore.getState().logout();
    navigate("/login", { replace: true });
  };
  const handleSave = async () => {
    if (!name.trim()) { notify("Vui lòng nhập họ và tên."); return; }
    // Chỉ gửi các trường đã thay đổi
    const payload: UpdateUserPayload = {};
    if (name.trim() !== user.fullName) payload.full_name = name.trim();
    if (email.trim() !== user.email) payload.email = email.trim();
    if (phone.trim() !== user.phone) payload.phone = phone.trim();
    if (dateOfBirth && dateOfBirth !== (user.dateOfBirth ?? "")) payload.date_of_birth = dateOfBirth;
    if (Object.keys(payload).length === 0) { setEditing(false); return; }
    setSaving(true);
    try {
      await userService.updateProfile(payload);
      // Cập nhật store để sidebar/header hiển thị thông tin mới
      useUserStore.setState({ user: await AuthService.getMe() });
      setEditing(false);
      notify("Đã lưu thông tin cá nhân.");
    } catch (err) {
      notify(getErrorMessage(err, "Không thể lưu thông tin. Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" }) : "";
  return <>
    <PageHeading eyebrow="TÀI KHOẢN CỦA BẠN" title="Thông tin cá nhân" description="Cập nhật thông tin để chúng tôi phục vụ bạn tốt hơn." />
    <div className="profile-layout"><aside className="panel profile-menu"><div className="profile-identity"><Avatar className="profile-avatar" name={name || displayName} src={user?.avatarUrl} /><h3>{name}</h3>{memberSince && <p>Thành viên từ tháng {memberSince}</p>}<span className="member-chip"><BadgeCheck size={14} /> Tài khoản đã xác thực</span></div><div className="profile-menu-list"><button className={tab === "info" ? "active" : ""} onClick={() => setTab("info")}><UserRound /> Thông tin cá nhân <ChevronRight /></button><button className={tab === "password" ? "active" : ""} onClick={() => setTab("password")}><Settings /> Đổi mật khẩu <ChevronRight /></button><button onClick={() => notify("Bạn chưa có đánh giá mới.")}><Star /> Đánh giá của tôi <ChevronRight /></button><button onClick={() => navigate("/help")}><CircleHelp /> Hỗ trợ & khiếu nại <ChevronRight /></button></div><button className="logout-button" onClick={() => void handleLogout()}><LogOut /> Đăng xuất</button></aside>
      {tab === "password" ? <ChangePasswordPanel notify={notify} onCancel={() => setTab("info")} onDone={() => setTab("info")} /> : <div className="panel profile-form-panel"><div className="panel-heading"><div><h2>Thông tin cơ bản</h2><p>Thông tin cá nhân của bạn được bảo mật.</p></div><button className="outline-button" disabled={saving} onClick={() => editing ? void handleSave() : setEditing(true)}>{editing ? <><Check size={15} /> {saving ? "Đang lưu..." : "Lưu thay đổi"}</> : <><Pencil size={15} /> Chỉnh sửa</>}</button></div><div className="profile-form"><label className="field-label">Họ và tên<input disabled={!editing} value={name} onChange={e => setName(e.target.value)} /></label><label className="field-label">Địa chỉ email<input disabled={!editing} type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label className="field-label">Số điện thoại<input disabled={!editing} value={phone} onChange={e => setPhone(e.target.value)} /></label><label className="field-label">Ngày sinh<input disabled={!editing} type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} /></label><label className="field-label field-span">Địa chỉ mặc định<input disabled value={defaultAddressText} /><button type="button" className="text-link" style={{ justifySelf: "start" }} onClick={goToAddresses}>Quản lý địa chỉ <ArrowRight size={14} /></button></label></div><div className="profile-security"><span><BadgeCheck /></span><div><strong>Bảo mật tài khoản</strong><p>Email và số điện thoại giúp bạn nhận thông báo về lịch lấy đồ, giao đồ và cập nhật đơn hàng.</p></div><button className="text-link" onClick={() => setTab("password")}>Đổi mật khẩu <ArrowRight size={14} /></button></div></div>}
    </div>
  </>;
}

type PasswordField = "current" | "next" | "confirm";

function ChangePasswordPanel({ notify, onCancel, onDone }: { notify: (message: string) => void; onCancel: () => void; onDone: () => void }) {
  const [values, setValues] = useState<Record<PasswordField, string>>({ current: "", next: "", confirm: "" });
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({ current: false, next: false, confirm: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const passedRules = PASSWORD_RULES.filter(rule => rule.test(values.next)).length;
  const strength = !values.next ? 0 : passedRules <= 2 ? 1 : passedRules === 3 ? 2 : 3;
  const strengthLabel = ["", "Yếu", "Trung bình", "Mạnh"][strength];
  const confirmMismatch = values.confirm !== "" && values.confirm !== values.next;
  const setValue = (field: PasswordField, value: string) => { setValues(prev => ({ ...prev, [field]: value })); setError(""); };
  const toggle = (field: PasswordField) => setVisible(prev => ({ ...prev, [field]: !prev[field] }));
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.current) { setError("Vui lòng nhập mật khẩu hiện tại."); return; }
    if (!isPasswordValid(values.next)) { setError("Mật khẩu mới chưa đáp ứng đủ các yêu cầu mật khẩu."); return; }
    if (values.next === values.current) { setError("Mật khẩu mới phải khác mật khẩu hiện tại."); return; }
    if (values.next !== values.confirm) { setError("Mật khẩu xác nhận không khớp."); return; }
    setSubmitting(true);
    try {
      await userService.changePassword({ current_password: values.current, new_password: values.next });
      notify("Đã đổi mật khẩu thành công.");
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể đổi mật khẩu. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };
  const renderInput = (field: PasswordField, label: string, placeholder: string, autoComplete: string) => (
    <label className="field-label">{label}
      <span className="password-input">
        <LockKeyhole size={15} />
        <input type={visible[field] ? "text" : "password"} autoComplete={autoComplete} placeholder={placeholder} maxLength={72} value={values[field]} onChange={e => setValue(field, e.target.value)} />
        <button type="button" aria-label={visible[field] ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => toggle(field)}>{visible[field] ? <EyeOff size={15} /> : <Eye size={15} />}</button>
      </span>
    </label>
  );
  return <form className="panel profile-form-panel" onSubmit={e => void handleSubmit(e)}>
    <div className="panel-heading"><div><h2>Đổi mật khẩu</h2><p>Dùng mật khẩu mạnh và không trùng với mật khẩu ở các dịch vụ khác.</p></div></div>
    <div className="password-layout">
      <div className="password-form">
        {renderInput("current", "Mật khẩu hiện tại", "Nhập mật khẩu hiện tại", "current-password")}
        {renderInput("next", "Mật khẩu mới", "Ít nhất 8 ký tự", "new-password")}
        {renderInput("confirm", "Xác nhận mật khẩu mới", "Nhập lại mật khẩu mới", "new-password")}
        {confirmMismatch && <p className="password-hint">Mật khẩu xác nhận chưa khớp.</p>}
        {error && <p className="password-error" role="alert">{error}</p>}
        <div className="password-actions">
          <button type="button" className="outline-button" onClick={onCancel} disabled={submitting}>Hủy</button>
          <button type="submit" className="primary-button" disabled={submitting}><Check size={15} /> {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</button>
        </div>
      </div>
      <aside className="password-aside">
        <div className="password-aside-card">
          <strong>Yêu cầu mật khẩu</strong>
          <div className="password-strength" aria-live="polite">
            <div className="password-strength-bar"><span className={`level-${strength}`} /></div>
            <small>{strength ? `Độ mạnh: ${strengthLabel}` : "Nhập mật khẩu mới để kiểm tra độ mạnh"}</small>
          </div>
          <ul className="password-checklist">
            {PASSWORD_RULES.map(rule => {
              const passed = rule.test(values.next);
              return <li key={rule.id} className={passed ? "passed" : ""}><span aria-hidden="true">{passed ? <Check size={12} /> : "○"}</span>{rule.label}</li>;
            })}
          </ul>
        </div>
        <div className="password-aside-card password-tips">
          <span><ShieldCheck size={18} /></span>
          <div><strong>Lưu ý bảo mật</strong><p>Không chia sẻ mật khẩu cho bất kỳ ai và nên đổi mật khẩu định kỳ. Sau khi đổi, bạn có thể cần đăng nhập lại trên các thiết bị khác.</p></div>
        </div>
      </aside>
    </div>
  </form>;
}
