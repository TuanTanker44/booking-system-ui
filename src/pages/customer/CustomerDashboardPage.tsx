import { useMemo, useState } from "react";
import {
  MapPin, Home, CalendarDays, Package, MapPinned, UserRound, Settings,
  Search, Bell, ChevronDown, ChevronRight, Plus, Clock3, Star, Truck,
  CheckCircle2, WashingMachine, Shirt, Sparkles, WalletCards, Menu, X,
  ArrowRight, SlidersHorizontal, CircleHelp, LogOut, CreditCard, Check,
  Minus, LocateFixed, Phone, Mail, Pencil, Trash2, BadgeCheck, Tag,
} from "lucide-react";

type Page = "home" | "booking" | "orders" | "addresses" | "profile";
type Service = { id: number; name: string; description: string; price: number; unit: string; icon: "wash" | "shirt" | "sparkles" };
type OrderStatus = "Đang xác nhận" | "Đang giặt" | "Sẵn sàng giao" | "Hoàn thành" | "Đã hủy";

const services: Service[] = [
  { id: 1, name: "Giặt theo kg", description: "Giặt sấy thường ngày", price: 15000, unit: "kg", icon: "wash" },
  { id: 2, name: "Giặt hấp cao cấp", description: "Chăm sóc vải chuyên biệt", price: 35000, unit: "kg", icon: "shirt" },
  { id: 3, name: "Giặt chăn ga gối", description: "Làm sạch sâu, khử mùi", price: 50000, unit: "món", icon: "sparkles" },
  { id: 4, name: "Đồ dễ giặt đặc biệt", description: "Giày, thú bông và đồ khác", price: 20000, unit: "món", icon: "sparkles" },
];

const stores = [
  { id: 1, name: "Laundry Center - Quận 1", distance: "2,3 km", time: "7 phút", rating: 4.8, reviews: 120, address: "25 Nguyễn Huệ, Quận 1" },
  { id: 2, name: "Fresh Laundry - Quận 3", distance: "3,1 km", time: "10 phút", rating: 4.7, reviews: 89, address: "18 Võ Văn Tần, Quận 3" },
  { id: 3, name: "Clean & Go - Quận 10", distance: "4,5 km", time: "12 phút", rating: 4.6, reviews: 76, address: "220 Sư Vạn Hạnh, Quận 10" },
];

const initialOrders = [
  { code: "LB20251015", date: "15/10/2026", store: "Laundry Center - Quận 1", service: "Giặt theo kg (5 kg)", total: 95000, status: "Đang giặt" as OrderStatus },
  { code: "LB20251014", date: "14/10/2026", store: "Fresh Laundry - Quận 3", service: "Giặt chăn ga (1 bộ)", total: 180000, status: "Sẵn sàng giao" as OrderStatus },
  { code: "LB20251013", date: "13/10/2026", store: "Clean & Go - Quận 10", service: "Giặt hấp (2 áo)", total: 120000, status: "Hoàn thành" as OrderStatus },
];

const formatMoney = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
const statusClass = (status: OrderStatus) => status === "Hoàn thành" ? "success" : status === "Đã hủy" ? "danger" : status === "Sẵn sàng giao" ? "purple" : "blue";
const iconFor = (icon: Service["icon"]) => icon === "wash" ? <WashingMachine /> : icon === "shirt" ? <Shirt /> : <Sparkles />;

export function CustomerDashboardPage() {
  const [page, setPage] = useState<Page>("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedStore, setSelectedStore] = useState(1);
  const [quantities, setQuantities] = useState<Record<number, number>>({ 1: 3, 2: 0, 3: 0, 4: 0 });
  const [pickupDate, setPickupDate] = useState("2026-10-16");
  const [pickupTime, setPickupTime] = useState("09:00 - 11:00");
  const [selectedAddress, setSelectedAddress] = useState("home");
  const [payment, setPayment] = useState("vnpay");
  const [toast, setToast] = useState("");

  const total = useMemo(() => services.reduce((sum, item) => sum + item.price * (quantities[item.id] || 0), 0), [quantities]);
  const filteredOrders = orders.filter(order => [order.code, order.store, order.service, order.status].some(value => value.toLowerCase().includes(search.toLowerCase())));

  const navigate = (next: Page) => {
    setPage(next);
    setMobileMenu(false);
    setActiveOrder(null);
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const changeQuantity = (id: number, delta: number) => setQuantities(current => ({ ...current, [id]: Math.max(0, (current[id] || 0) + delta) }));
  const submitBooking = () => {
    const newOrder = {
      code: `LB${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleDateString("vi-VN"),
      store: stores.find(store => store.id === selectedStore)?.name || stores[0].name,
      service: services.filter(service => quantities[service.id] > 0).map(service => `${service.name} (${quantities[service.id]} ${service.unit})`).join(", "),
      total: total + Math.round(total * 0.1),
      status: "Đang xác nhận" as OrderStatus,
    };
    setOrders(current => [newOrder, ...current]);
    setActiveOrder(newOrder.code);
    setPage("orders");
    setBookingStep(1);
    notify("Đặt lịch thành công! Đơn hàng đang chờ xác nhận.");
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
      {mobileMenu && <button className="mobile-scrim" aria-label="Đóng menu" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><WashingMachine size={23} /></span>
          <span>Laundry<span className="brand-blue">Booking</span><small>GIẶT SẠCH, SỐNG NHẸ</small></span>
          <button className="icon-button close-menu" onClick={() => setMobileMenu(false)} aria-label="Đóng menu"><X /></button>
        </div>
        <div className="sidebar-label">MENU CHÍNH</div>
        <nav className="side-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
              {item.icon}<span>{item.label}</span>{item.id === "orders" && <span className="nav-count">{orders.filter(o => o.status !== "Hoàn thành" && o.status !== "Đã hủy").length}</span>}
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
          <button className="nav-item" onClick={() => notify("Trung tâm hỗ trợ sẽ sớm kết nối.")}><CircleHelp /><span>Trợ giúp & hỗ trợ</span></button>
          <div className="sidebar-user"><div className="avatar">NT</div><div><strong>Ngô Tuấn</strong><small>Khách hàng</small></div><ChevronDown size={16} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-trigger" onClick={() => setMobileMenu(true)} aria-label="Mở menu"><Menu /></button>
          <div className="breadcrumb"><span>Khách hàng</span><ChevronRight size={14} /><strong>{navItems.find(item => item.id === page)?.label || "Trang chủ"}</strong></div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" aria-label="Thông báo" onClick={() => notify("Bạn đã xem các thông báo mới nhất.")}><Bell /><i /></button>
            <div className="topbar-divider" />
            <button className="user-menu" onClick={() => navigate("profile")}><div className="avatar small-avatar">NT</div><span>Ngô Tuấn</span><ChevronDown size={15} /></button>
          </div>
        </header>

        <div className="page-content">
          {page === "home" && <HomePage navigate={navigate} setSearch={setSearch} />}
          {page === "booking" && <BookingPage step={bookingStep} setStep={setBookingStep} selectedStore={selectedStore} setSelectedStore={setSelectedStore} quantities={quantities} changeQuantity={changeQuantity} total={total} pickupDate={pickupDate} setPickupDate={setPickupDate} pickupTime={pickupTime} setPickupTime={setPickupTime} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} payment={payment} setPayment={setPayment} submitBooking={submitBooking} notify={notify} />}
          {page === "orders" && <OrdersPage orders={filteredOrders} search={search} setSearch={setSearch} activeOrder={activeOrder} setActiveOrder={setActiveOrder} navigate={navigate} />}
          {page === "addresses" && <AddressesPage notify={notify} />}
          {page === "profile" && <ProfilePage notify={notify} />}
        </div>
        <footer className="footer"><span>© 2026 Laundry Booking</span><span>Giặt sạch mỗi ngày, nhẹ nhàng cuộc sống <span className="footer-heart">♥</span></span></footer>
      </main>
      <nav className="mobile-bottom-nav">
        {[
          { id: "home" as Page, label: "Trang chủ", icon: <Home /> },
          { id: "booking" as Page, label: "Đặt lịch", icon: <CalendarDays /> },
          { id: "orders" as Page, label: "Đơn hàng", icon: <Package /> },
          { id: "addresses" as Page, label: "Địa chỉ", icon: <MapPin /> },
          { id: "profile" as Page, label: "Tài khoản", icon: <UserRound /> },
        ].map(item => <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => navigate(item.id)}>{item.icon}<span>{item.label}</span></button>)}
      </nav>
      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function HomePage({ navigate, setSearch }: { navigate: (page: Page) => void; setSearch: (value: string) => void }) {
  return <>
    <section className="hero">
      <div className="hero-copy">
        <div className="hero-kicker"><Sparkles size={14} /> DỊCH VỤ GIẶT ỦI THÔNG MINH</div>
        <h1>Giặt sạch dễ dàng,<br /><span>cuộc sống nhẹ nhàng.</span></h1>
        <p>Đặt lịch giặt online, giao nhận tận nơi. Dành thời gian cho những điều bạn yêu thích.</p>
        <div className="hero-search">
          <MapPin size={18} /><input aria-label="Tìm địa chỉ" placeholder="Nhập khu vực hoặc địa chỉ của bạn" onChange={e => setSearch(e.target.value)} /><button onClick={() => navigate("booking")}>Đặt lịch ngay <ArrowRight size={16} /></button>
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
      <div className="service-grid">{services.map((service, index) => <button className="service-card" key={service.id} onClick={() => navigate("booking")}><div className={`service-art art-${index + 1}`}>{iconFor(service.icon)}</div><h3>{service.name}</h3><p>{service.description}</p><div className="service-price"><strong>{formatMoney(service.price)}</strong><span>/{service.unit}</span><ArrowRight size={16} /></div></button>)}</div>
    </section>

    <section className="section-block store-section">
      <div className="section-title"><div><span className="eyebrow">GẦN BẠN</span><h2>Cửa hàng được yêu thích</h2><p>Chọn cửa hàng phù hợp với lịch trình của bạn.</p></div><button className="text-link" onClick={() => navigate("booking")}>Xem tất cả <ArrowRight size={16} /></button></div>
      <div className="store-grid">{stores.map((store, i) => <div className="store-card" key={store.id}><div className={`store-thumb store-thumb-${i + 1}`}><div className="store-building"><span /><span /><span /><span /></div><span className="store-open"><i /> Đang mở cửa</span></div><div className="store-info"><div className="store-name-row"><h3>{store.name}</h3><span className="rating"><Star size={13} fill="currentColor" /> {store.rating}</span></div><p><MapPin size={14} /> {store.address}</p><div className="store-meta"><span><Truck size={14} /> {store.distance}</span><span><Clock3 size={14} /> {store.time}</span><span>({store.reviews} đánh giá)</span></div><button className="outline-button" onClick={() => navigate("booking")}>Chọn cửa hàng <ArrowRight size={15} /></button></div></div>)}</div>
    </section>

    <section className="bottom-cta"><div className="cta-spark cta-spark-one">✦</div><div className="cta-copy"><span className="eyebrow">BẮT ĐẦU NGAY HÔM NAY</span><h2>Để việc giặt giũ cho chúng tôi.</h2><p>Đặt lịch chỉ trong vài phút, nhận quần áo sạch thơm ngay tại nhà.</p><button className="white-button" onClick={() => navigate("booking")}>Đặt lịch giặt ngay <ArrowRight size={16} /></button></div><div className="cta-illustration"><div className="cta-shirt"><Shirt /></div><div className="cta-basket"><span /><span /><span /></div><div className="cta-spark cta-spark-two">✦</div></div></section>
  </>;
}

function BookingPage(props: {
  step: number; setStep: (step: number) => void; selectedStore: number; setSelectedStore: (id: number) => void;
  quantities: Record<number, number>; changeQuantity: (id: number, delta: number) => void; total: number;
  pickupDate: string; setPickupDate: (date: string) => void; pickupTime: string; setPickupTime: (time: string) => void;
  selectedAddress: string; setSelectedAddress: (address: string) => void; payment: string; setPayment: (payment: string) => void;
  submitBooking: () => void; notify: (message: string) => void;
}) {
  const { step, setStep, selectedStore, setSelectedStore, quantities, changeQuantity, total, pickupDate, setPickupDate, pickupTime, setPickupTime, selectedAddress, setSelectedAddress, payment, setPayment, submitBooking, notify } = props;
  const [storeQuery, setStoreQuery] = useState("");
  const selectedStoreData = stores.find(store => store.id === selectedStore) || stores[0];
  const hasServices = Object.values(quantities).some(value => value > 0);
  return <>
    <PageHeading eyebrow="ĐẶT LỊCH ONLINE" title="Đặt lịch giặt của bạn" description="Chỉ vài bước đơn giản để quần áo sạch thơm được giao tận nhà." action={<div className="secure-note"><BadgeCheck size={17} /> Đặt lịch an toàn</div>} />
    <div className="booking-layout">
      <div className="booking-main">
        <div className="stepper">{["Cửa hàng & dịch vụ", "Thời gian & địa chỉ", "Thanh toán"].map((label, index) => <div className={`stepper-item ${step === index + 1 ? "current" : ""} ${step > index + 1 ? "done" : ""}`} key={label}><span>{step > index + 1 ? <Check size={16} /> : index + 1}</span><div><small>BƯỚC {index + 1}</small><strong>{label}</strong></div>{index < 2 && <div className="step-line" />}</div>)}</div>

        {step === 1 && <>
          <div className="panel"><div className="panel-heading"><div><h2><MapPin /> Chọn cửa hàng</h2><p>Chọn cửa hàng thuận tiện cho việc lấy đồ.</p></div><span className="optional-tag">Bắt buộc</span></div><div className="input-with-icon store-search"><Search /><input value={storeQuery} onChange={e => setStoreQuery(e.target.value)} placeholder="Tìm cửa hàng hoặc khu vực..." /></div>
            <div className="booking-store-list">{stores.filter(store => store.name.toLowerCase().includes(storeQuery.toLowerCase()) || store.address.toLowerCase().includes(storeQuery.toLowerCase())).map(store => <button key={store.id} className={`booking-store ${selectedStore === store.id ? "selected" : ""}`} onClick={() => setSelectedStore(store.id)}><span className="radio-dot">{selectedStore === store.id && <i />}</span><span className="store-mini-icon"><WashingMachine /></span><span className="booking-store-details"><strong>{store.name}</strong><small><MapPin size={12} /> {store.address}</small><small><Truck size={12} /> {store.distance} · khoảng {store.time}</small></span><span className="booking-store-rating"><Star size={13} fill="currentColor" /> {store.rating}</span></button>)}</div>
          </div>
          <div className="panel"><div className="panel-heading"><div><h2><WashingMachine /> Chọn dịch vụ</h2><p>Chọn số lượng tương ứng với đồ cần giặt.</p></div></div><div className="booking-service-list">{services.map(service => <div className="booking-service" key={service.id}><span className={`booking-service-icon service-icon-${service.id}`}>{iconFor(service.icon)}</span><div className="booking-service-info"><strong>{service.name}</strong><small>{service.description}</small><span>{formatMoney(service.price)} / {service.unit}</span></div><div className="quantity-control"><button aria-label="Giảm số lượng" onClick={() => changeQuantity(service.id, -1)} disabled={!quantities[service.id]}><Minus size={14} /></button><span>{quantities[service.id] || 0}</span><button aria-label="Tăng số lượng" onClick={() => changeQuantity(service.id, 1)}><Plus size={14} /></button></div></div>)}</div></div>
        </>}
        {step === 2 && <div className="panel"><div className="panel-heading"><div><h2><CalendarDays /> Thời gian lấy đồ</h2><p>Chọn ngày và khung giờ phù hợp.</p></div></div><div className="form-grid"><label className="field-label">Ngày lấy đồ<input type="date" min={new Date().toISOString().slice(0, 10)} value={pickupDate} onChange={e => setPickupDate(e.target.value)} /></label><label className="field-label">Khung giờ<select value={pickupTime} onChange={e => setPickupTime(e.target.value)}><option>09:00 - 11:00</option><option>11:00 - 13:00</option><option>14:00 - 16:00</option><option>17:00 - 19:00</option></select></label></div><div className="panel-heading address-heading"><div><h2><MapPinned /> Địa chỉ giao nhận</h2><p>Shipper sẽ đến lấy đồ và giao lại tại địa chỉ này.</p></div><button className="text-link" onClick={() => notify("Chức năng thêm địa chỉ mới sẽ kết nối API.")}><Plus size={15} /> Thêm địa chỉ</button></div><div className="address-options"><button className={`address-option ${selectedAddress === "home" ? "selected" : ""}`} onClick={() => setSelectedAddress("home")}><span className="radio-dot">{selectedAddress === "home" && <i />}</span><Home /><span><strong>Nhà riêng</strong><small>Ngô Tuấn · 0912 345 678</small><small>123 Nguyễn Văn Cừ, Quận 1, TP.HCM</small></span><span className="default-tag">Mặc định</span></button><button className={`address-option ${selectedAddress === "office" ? "selected" : ""}`} onClick={() => setSelectedAddress("office")}><span className="radio-dot">{selectedAddress === "office" && <i />}</span><MapPin /><span><strong>Cơ quan</strong><small>Ngô Tuấn · 0912 345 678</small><small>40B Lê Lợi, Quận 3, TP.HCM</small></span></button></div><label className="field-label note-field">Ghi chú cho shipper (không bắt buộc)<textarea placeholder="Ví dụ: gọi điện trước khi đến, giao tại sảnh..." rows={3} /></label></div>}
        {step === 3 && <div className="panel"><div className="panel-heading"><div><h2><CreditCard /> Phương thức thanh toán</h2><p>Chọn cách thanh toán tiền cọc và phần còn lại.</p></div></div><div className="payment-options">{[{id:"vnpay",title:"VNPay",desc:"Quét mã QR hoặc ứng dụng ngân hàng",icon:"V"},{id:"momo",title:"Ví MoMo",desc:"Thanh toán nhanh qua ví điện tử",icon:"M"},{id:"cash",title:"Tiền mặt",desc:"Thanh toán với nhân viên giao nhận",icon:"₫"}].map(item => <button key={item.id} className={`payment-option ${payment === item.id ? "selected" : ""}`} onClick={() => setPayment(item.id)}><span className={`payment-logo payment-${item.id}`}>{item.icon}</span><span><strong>{item.title}</strong><small>{item.desc}</small></span><span className="radio-dot">{payment === item.id && <i />}</span></button>)}</div><div className="deposit-note"><WalletCards /><div><strong>Thanh toán tiền cọc</strong><p>Tiền cọc dự kiến là 20% giá trị đơn hàng. Cửa hàng sẽ xác nhận giá cuối cùng sau khi cân/kiểm tra đồ.</p></div></div><div className="booking-review"><h3>Thông tin đặt lịch</h3><div><span>Cửa hàng</span><strong>{selectedStoreData.name}</strong></div><div><span>Ngày lấy đồ</span><strong>{pickupDate} · {pickupTime}</strong></div><div><span>Địa chỉ</span><strong>{selectedAddress === "home" ? "Nhà riêng, 123 Nguyễn Văn Cừ" : "Cơ quan, 40B Lê Lợi"}</strong></div></div></div>}
        <div className="booking-actions">{step > 1 ? <button className="outline-button" onClick={() => setStep(step - 1)}>Quay lại</button> : <span className="booking-hint"><CheckCircle2 size={15} /> Không mất phí khi đặt lịch</span>}{step < 3 ? <button className="primary-button" disabled={step === 1 && !hasServices} onClick={() => setStep(step + 1)}>Tiếp tục <ArrowRight size={16} /></button> : <button className="primary-button" onClick={submitBooking}><CheckCircle2 size={17} /> Xác nhận đặt lịch</button>}</div>
      </div>
      <aside className="booking-summary"><div className="summary-title"><h3>Tóm tắt đơn hàng</h3><span className="summary-bag"><Package /></span></div><div className="summary-store"><span className="summary-store-icon"><WashingMachine /></span><div><strong>{selectedStoreData.name}</strong><small><MapPin size={12} /> {selectedStoreData.distance} từ vị trí của bạn</small></div></div><div className="summary-lines">{services.filter(service => quantities[service.id] > 0).map(service => <div className="summary-line" key={service.id}><span>{service.name} <small>× {quantities[service.id]}</small></span><strong>{formatMoney(service.price * quantities[service.id])}</strong></div>)}{!hasServices && <div className="empty-summary">Chọn dịch vụ để xem tạm tính.</div>}</div><div className="summary-coupon"><Tag /><input placeholder="Mã ưu đãi" /><button onClick={() => notify("Mã ưu đãi sẽ được kiểm tra khi kết nối backend.")}>Áp dụng</button></div><div className="summary-total"><span>Tạm tính</span><strong>{formatMoney(total)}</strong></div><div className="summary-total"><span>Phí giao nhận</span><strong className="free-text">{total >= 150000 ? "Miễn phí" : "15.000đ"}</strong></div><div className="summary-total"><span>Ưu đãi</span><strong className="discount-text">-{formatMoney(0)}</strong></div><div className="summary-grand"><span>Tổng tạm tính</span><strong>{formatMoney(total + (total > 0 && total < 150000 ? 15000 : 0))}</strong></div><div className="summary-footnote"><CheckCircle2 size={15} /> Giá cuối cùng được xác nhận sau khi cửa hàng kiểm tra đồ.</div><div className="summary-support"><CircleHelp /><span>Cần hỗ trợ?<strong>1900 1234</strong></span></div></aside>
    </div>
  </>;
}

function OrdersPage({ orders, search, setSearch, activeOrder, setActiveOrder, navigate }: { orders: typeof initialOrders; search: string; setSearch: (v: string) => void; activeOrder: string | null; setActiveOrder: (v: string | null) => void; navigate: (p: Page) => void }) {
  const [filter, setFilter] = useState("Tất cả");
  const tabs = ["Tất cả", "Đang xử lý", "Sẵn sàng giao", "Hoàn thành", "Đã hủy"];
  const filtered = orders.filter(order => filter === "Tất cả" || (filter === "Đang xử lý" && ["Đang xác nhận", "Đang giặt"].includes(order.status)) || order.status === filter);
  const order = orders.find(item => item.code === activeOrder);
  if (order) return <><PageHeading eyebrow="LỊCH SỬ ĐẶT HÀNG" title={`Đơn hàng #${order.code}`} description="Theo dõi tiến trình và xem chi tiết đơn hàng của bạn." action={<button className="outline-button" onClick={() => setActiveOrder(null)}>← Quay lại danh sách</button>} /><div className="order-detail-layout"><div className="panel order-tracking-panel"><div className="tracking-top"><div><span className={`status-pill ${statusClass(order.status)}`}><i />{order.status}</span><h2>Đơn hàng của bạn đang được xử lý</h2><p>Cập nhật trạng thái theo thời gian thực khi kết nối hệ thống.</p></div><div className="tracking-illustration"><Package /></div></div><div className="tracking-timeline">{[{title:"Đặt lịch thành công",date:order.date,done:true},{title:"Cửa hàng xác nhận",date:"Đang cập nhật",done:order.status !== "Đang xác nhận"},{title:"Đang giặt & chăm sóc",date:order.status === "Đang giặt" ? "Đang thực hiện" : "Chờ xử lý",done:["Sẵn sàng giao","Hoàn thành"].includes(order.status) || order.status === "Đang giặt"},{title:"Đang giao đến bạn",date:order.status === "Sẵn sàng giao" ? "Sẵn sàng giao" : "Chờ xử lý",done:order.status === "Sẵn sàng giao" || order.status === "Hoàn thành"},{title:"Hoàn thành",date:order.status === "Hoàn thành" ? "Đã hoàn tất" : "Chờ xử lý",done:order.status === "Hoàn thành"}].map((item, i) => <div className={`timeline-item ${item.done ? "done" : ""}`} key={item.title}><span className="timeline-marker">{item.done ? <Check size={13} /> : i + 1}</span><div><strong>{item.title}</strong><small>{item.date}</small></div></div>)}</div></div><div className="panel"><h2 className="panel-title-text">Thông tin đơn hàng</h2><div className="detail-row"><span>Mã đơn hàng</span><strong>{order.code}</strong></div><div className="detail-row"><span>Cửa hàng</span><strong>{order.store}</strong></div><div className="detail-row"><span>Dịch vụ</span><strong>{order.service}</strong></div><div className="detail-row"><span>Ngày đặt</span><strong>{order.date}</strong></div><div className="detail-row total-row"><span>Tổng tiền tạm tính</span><strong>{formatMoney(order.total)}</strong></div><button className="primary-button full-button" onClick={() => navigate("booking")}>Đặt đơn mới <ArrowRight size={16} /></button></div></div></>;
  return <>
    <PageHeading eyebrow="QUẢN LÝ ĐƠN HÀNG" title="Đơn hàng của tôi" description="Theo dõi tình trạng giặt ủi và xem lại các đơn hàng trước đây." action={<button className="primary-button" onClick={() => navigate("booking")}><Plus size={17} /> Đặt lịch mới</button>} />
    <div className="order-stats"><div><span className="stat-icon stat-blue"><Package /></span><div><small>Tổng đơn hàng</small><strong>{orders.length}</strong></div></div><div><span className="stat-icon stat-orange"><Clock3 /></span><div><small>Đang xử lý</small><strong>{orders.filter(o => ["Đang xác nhận","Đang giặt"].includes(o.status)).length}</strong></div></div><div><span className="stat-icon stat-purple"><Truck /></span><div><small>Sẵn sàng giao</small><strong>{orders.filter(o => o.status === "Sẵn sàng giao").length}</strong></div></div><div><span className="stat-icon stat-green"><CheckCircle2 /></span><div><small>Hoàn thành</small><strong>{orders.filter(o => o.status === "Hoàn thành").length}</strong></div></div></div>
    <div className="panel orders-panel"><div className="orders-toolbar"><div className="filter-tabs">{tabs.map(tab => <button key={tab} className={filter === tab ? "active" : ""} onClick={() => setFilter(tab)}>{tab}</button>)}</div><div className="orders-search"><Search /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã đơn, cửa hàng..." /><button aria-label="Bộ lọc"><SlidersHorizontal size={16} /></button></div></div><div className="table-wrap"><table><thead><tr><th>MÃ ĐƠN HÀNG</th><th>NGÀY ĐẶT</th><th>DỊCH VỤ / CỬA HÀNG</th><th>TRẠNG THÁI</th><th>TỔNG TIỀN</th><th></th></tr></thead><tbody>{filtered.map(item => <tr key={item.code}><td><strong className="order-code">{item.code}</strong></td><td>{item.date}</td><td><strong>{item.service}</strong><small className="table-subtitle">{item.store}</small></td><td><span className={`status-pill ${statusClass(item.status)}`}><i />{item.status}</span></td><td><strong>{formatMoney(item.total)}</strong></td><td><button className="table-action" onClick={() => setActiveOrder(item.code)}>Chi tiết <ChevronRight size={14} /></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state"><Package /><strong>Không tìm thấy đơn hàng</strong><p>Thử từ khóa khác hoặc chọn trạng thái khác.</p></div>}</div><div className="table-footer"><span>Hiển thị {filtered.length} / {orders.length} đơn hàng</span><button className="text-link" onClick={() => { setSearch(""); }}>Xóa tìm kiếm</button></div></div>
  </>;
}

function AddressesPage({ notify }: { notify: (message: string) => void }) {
  const [addresses, setAddresses] = useState([{ id: "home", title: "Nhà riêng", recipient: "Ngô Tuấn", phone: "0912 345 678", email: "tuan.ngo@example.com", address: "123 Nguyễn Văn Cừ, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM", default: true }, { id: "office", title: "Cơ quan", recipient: "Ngô Tuấn", phone: "0912 345 678", email: "tuan.ngo@example.com", address: "40B Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM", default: false }]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("Nhà riêng");
  const [recipient, setRecipient] = useState("Ngô Tuấn");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const save = () => {
    if (!recipient.trim() || !phone.trim() || !email.trim() || !address.trim()) { notify("Vui lòng nhập đầy đủ thông tin địa chỉ."); return; }
    setAddresses(current => [...current, { id: `address-${Date.now()}`, title, recipient, phone, email, address, default: current.length === 0 }]);
    setShowForm(false); setPhone(""); setEmail(""); setAddress(""); notify("Đã thêm địa chỉ mới.");
  };
  return <>
    <PageHeading eyebrow="SỔ ĐỊA CHỈ" title="Địa chỉ của tôi" description="Quản lý địa chỉ lấy và giao đồ giặt của bạn." action={<button className="primary-button" onClick={() => setShowForm(!showForm)}><Plus size={17} /> Thêm địa chỉ</button>} />
    {showForm && <div className="panel address-form"><div className="panel-heading"><div><h2><MapPinned /> Thêm địa chỉ mới</h2><p>Thông tin này sẽ được dùng khi đặt lịch lấy và giao đồ.</p></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Đóng"><X /></button></div><div className="form-grid"><label className="field-label">Tên địa chỉ<select value={title} onChange={e => setTitle(e.target.value)}><option>Nhà riêng</option><option>Cơ quan</option><option>Khác</option></select></label><label className="field-label">Người nhận<input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Họ và tên người nhận" /></label><label className="field-label">Số điện thoại<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xx xxx xxx" /></label><label className="field-label">Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" /></label><label className="field-label field-span">Địa chỉ chi tiết<input value={address} onChange={e => setAddress(e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện..." /></label></div><div className="form-actions"><button className="outline-button" onClick={() => setShowForm(false)}>Hủy</button><button className="primary-button" onClick={save}><Check size={16} /> Lưu địa chỉ</button></div></div>}
    <div className="address-page-grid">{addresses.map(item => <div className="panel address-card" key={item.id}><div className="address-card-top"><span className="address-large-icon">{item.title === "Nhà riêng" ? <Home /> : <MapPin />}</span><div className="address-title"><h3>{item.title}</h3>{item.default && <span className="default-tag">Mặc định</span>}</div><button className="icon-button" aria-label="Tùy chọn địa chỉ" onClick={() => notify("Các thao tác địa chỉ sẽ kết nối API.")}>•••</button></div><div className="address-recipient"><strong>{item.recipient}</strong><span><Phone size={14} /> {item.phone}</span><span><Mail size={14} /> {item.email}</span></div><p className="address-full"><MapPin size={15} />{item.address}</p><div className="address-card-actions"><button onClick={() => notify("Chức năng chỉnh sửa địa chỉ sẽ kết nối API.")}><Pencil size={15} /> Chỉnh sửa</button><button onClick={() => setAddresses(current => current.filter(a => a.id !== item.id))}><Trash2 size={15} /> Xóa</button>{!item.default && <button onClick={() => setAddresses(current => current.map(a => ({ ...a, default: a.id === item.id })))}><CheckCircle2 size={15} /> Đặt mặc định</button>}</div></div>)}
      <button className="add-address-card" onClick={() => setShowForm(true)}><span><Plus /></span><strong>Thêm địa chỉ mới</strong><small>Lưu địa chỉ để đặt lịch nhanh hơn</small></button></div>
    <div className="address-tip"><LocateFixed /><div><strong>Mẹo nhỏ</strong><p>Hãy nhập địa chỉ càng chi tiết càng tốt để shipper tìm bạn nhanh hơn. Tích hợp bản đồ sẽ hỗ trợ định vị chính xác hơn.</p></div></div>
  </>;
}

function ProfilePage({ notify }: { notify: (message: string) => void }) {
  const [name, setName] = useState("Ngô Tuấn");
  const [email, setEmail] = useState("tuan.ngo@example.com");
  const [phone, setPhone] = useState("0912 345 678");
  const [editing, setEditing] = useState(false);
  return <>
    <PageHeading eyebrow="TÀI KHOẢN CỦA BẠN" title="Thông tin cá nhân" description="Cập nhật thông tin để chúng tôi phục vụ bạn tốt hơn." />
    <div className="profile-layout"><aside className="panel profile-menu"><div className="profile-identity"><div className="profile-avatar">NT</div><h3>{name}</h3><p>Thành viên từ tháng 08/2026</p><span className="member-chip"><BadgeCheck size={14} /> Tài khoản đã xác thực</span></div><div className="profile-menu-list"><button className="active"><UserRound /> Thông tin cá nhân <ChevronRight /></button><button onClick={() => notify("Chức năng đổi mật khẩu sẽ kết nối API.")}><Settings /> Đổi mật khẩu <ChevronRight /></button><button onClick={() => notify("Bạn chưa có đánh giá mới.")}><Star /> Đánh giá của tôi <ChevronRight /></button><button onClick={() => notify("Trung tâm khiếu nại sẽ sớm kết nối.")}><CircleHelp /> Hỗ trợ & khiếu nại <ChevronRight /></button></div><button className="logout-button" onClick={() => notify("Chức năng đăng xuất sẽ kết nối Auth API.")}><LogOut /> Đăng xuất</button></aside>
      <div className="panel profile-form-panel"><div className="panel-heading"><div><h2>Thông tin cơ bản</h2><p>Thông tin cá nhân của bạn được bảo mật.</p></div><button className="outline-button" onClick={() => editing ? (setEditing(false), notify("Đã lưu thông tin (bản demo).")) : setEditing(true)}>{editing ? <><Check size={15} /> Lưu thay đổi</> : <><Pencil size={15} /> Chỉnh sửa</>}</button></div><div className="profile-form"><label className="field-label">Họ và tên<input disabled={!editing} value={name} onChange={e => setName(e.target.value)} /></label><label className="field-label">Địa chỉ email<input disabled={!editing} type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label className="field-label">Số điện thoại<input disabled={!editing} value={phone} onChange={e => setPhone(e.target.value)} /></label><label className="field-label">Ngày sinh<input disabled={!editing} type="date" defaultValue="2003-08-15" /></label><label className="field-label field-span">Địa chỉ mặc định<input disabled value="123 Nguyễn Văn Cừ, Quận 1, TP.HCM" /></label></div><div className="profile-security"><span><BadgeCheck /></span><div><strong>Bảo mật tài khoản</strong><p>Email và số điện thoại giúp bạn nhận thông báo về lịch lấy đồ, giao đồ và cập nhật đơn hàng.</p></div><button className="text-link" onClick={() => notify("Chức năng bảo mật sẽ kết nối Auth API.")}>Thiết lập <ArrowRight size={14} /></button></div></div>
    </div>
  </>;
}