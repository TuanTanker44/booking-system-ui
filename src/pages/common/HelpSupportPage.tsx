import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarCheck, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, CreditCard, Mail, MessageCircle, PackageCheck, Search,
  ShieldCheck, Shirt, Sparkles, Truck, WashingMachine, XCircle,
} from "lucide-react";
import "./help-support.css";

type HelpItem = { question: string; answer: string; category: string };

const helpItems: HelpItem[] = [
  { category: "Tài khoản", question: "Làm thế nào để tạo tài khoản?", answer: "Chọn Đăng ký, nhập thông tin được yêu cầu và hoàn tất biểu mẫu. Nếu hệ thống yêu cầu xác thực email, hãy mở email xác minh và làm theo hướng dẫn trong thư." },
  { category: "Tài khoản", question: "Tôi chưa nhận được email xác thực thì phải làm gì?", answer: "Kiểm tra thư mục Spam/Thư rác và xác nhận bạn đã nhập đúng địa chỉ email. Nếu vẫn chưa nhận được, hãy thử gửi lại email xác thực từ màn hình xác minh email." },
  { category: "Đặt dịch vụ", question: "Làm thế nào để đặt lịch giặt?", answer: "Đăng nhập, chọn cửa hàng phù hợp, xem dịch vụ và đơn giá, chọn các dịch vụ cần dùng, nhập địa chỉ cùng khung giờ nhận đồ rồi kiểm tra lại thông tin trước khi xác nhận đặt lịch." },
  { category: "Đặt dịch vụ", question: "Tôi có thể theo dõi trạng thái đơn hàng ở đâu?", answer: "Mở mục Đơn hàng của tôi trong khu vực khách hàng. Trạng thái đơn có thể lần lượt gồm chờ thanh toán, đã xác nhận, đã nhận đồ, đang xử lý, sẵn sàng giao, đang giao và hoàn thành." },
  { category: "Đặt dịch vụ", question: "Tôi có thể chọn nhiều dịch vụ trong một đơn không?", answer: "Bạn có thể chọn nhiều dịch vụ được cửa hàng cung cấp trong cùng một đơn. Vui lòng kiểm tra đơn giá, đơn vị tính và tổng tiền trước khi xác nhận." },
  { category: "Thanh toán", question: "Tôi có thể thanh toán bằng cách nào?", answer: "Các phương thức thanh toán khả dụng sẽ được hiển thị tại bước thanh toán của đơn hàng. Chỉ tiếp tục khi phương thức, số tiền và thông tin đơn hàng đều chính xác." },
  { category: "Thanh toán", question: "Thanh toán thành công nhưng đơn chưa cập nhật thì sao?", answer: "Không nên thanh toán lặp lại ngay. Hãy kiểm tra trạng thái đơn và lịch sử giao dịch sau ít phút. Nếu trạng thái vẫn chưa thay đổi, hãy lưu lại mã giao dịch và liên hệ bộ phận hỗ trợ." },
  { category: "Hủy đơn & hoàn tiền", question: "Tôi có thể hủy đơn hàng không?", answer: "Khả năng hủy phụ thuộc vào trạng thái xử lý và chính sách của cửa hàng. Mở chi tiết đơn hàng để kiểm tra thao tác khả dụng; nếu không có tùy chọn hủy, hãy liên hệ cửa hàng hoặc bộ phận hỗ trợ." },
  { category: "Hủy đơn & hoàn tiền", question: "Khi nào tôi được hoàn tiền?", answer: "Việc hoàn tiền phụ thuộc vào phương thức thanh toán, trạng thái đơn hàng và chính sách áp dụng cho giao dịch. Mức hoàn, điều kiện và thời gian xử lý cần được xác nhận theo chính sách chính thức của hệ thống/cửa hàng." },
  { category: "Sự cố", question: "Tôi không tìm thấy cửa hàng gần khu vực của mình.", answer: "Kiểm tra quyền truy cập vị trí trên trình duyệt hoặc thử chọn/nhập khu vực khác. Danh sách cửa hàng còn phụ thuộc vào dữ liệu cửa hàng đang hoạt động và phạm vi phục vụ." },
];

const categories = [
  { name: "Bắt đầu sử dụng", description: "Tài khoản và xác thực email", icon: BookOpen, target: "guide" },
  { name: "Đặt lịch giặt", description: "Dịch vụ, địa chỉ và đơn hàng", icon: CalendarCheck, target: "faq" },
  { name: "Thanh toán", description: "Giao dịch và trạng thái thanh toán", icon: CreditCard, target: "faq" },
  { name: "Chính sách", description: "Quy định sử dụng dịch vụ", icon: ShieldCheck, target: "policies" },
];

export function HelpSupportPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [openQuestion, setOpenQuestion] = useState<string | null>(helpItems[0]?.question ?? null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return helpItems.filter((item) => {
      const matchesCategory = activeCategory === "Tất cả" || item.category === activeCategory;
      const matchesQuery = !query || `${item.question} ${item.answer} ${item.category}`.toLocaleLowerCase("vi").includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [search, activeCategory]);

  return (
    <main className="help-page">
      <header className="help-topbar">
        <Link className="help-brand" to="/login" aria-label="Laundry Booking - quay lại đăng nhập">
          <span className="help-brand-mark"><WashingMachine size={23} /></span>
          <span>Laundry<span>Booking</span><small>CHĂM SÓC ĐỒ VẢI CỦA BẠN</small></span>
        </Link>
        <Link className="help-back-link" to="/login"><ArrowLeft size={16} /> Quay lại đăng nhập</Link>
      </header>

      <section className="help-hero">
        <div className="help-hero-orb help-hero-orb-one" />
        <div className="help-hero-orb help-hero-orb-two" />
        <div className="help-hero-content">
          <span className="help-eyebrow"><Sparkles size={14} /> TRUNG TÂM HỖ TRỢ</span>
          <h1>Chúng tôi có thể<br /><span>giúp gì cho bạn?</span></h1>
          <p>Tìm hướng dẫn, giải đáp thắc mắc và tìm hiểu các chính sách khi sử dụng dịch vụ giặt ủi.</p>
          <label className="help-search">
            <Search size={20} />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setActiveCategory("Tất cả"); }} placeholder="Tìm câu trả lời, ví dụ: thanh toán, hủy đơn..." aria-label="Tìm kiếm trợ giúp" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Xóa nội dung tìm kiếm"><XCircle size={18} /></button>}
          </label>
          <div className="help-hero-note"><CheckCircle2 size={15} /> Hướng dẫn rõ ràng, dễ thực hiện, luôn sẵn sàng khi bạn cần.</div>
        </div>
        <div className="help-hero-art" aria-hidden="true">
          <div className="help-art-circle"><WashingMachine size={100} strokeWidth={1.25} /></div>
          <span className="help-art-bubble bubble-one"><Shirt size={24} /></span>
          <span className="help-art-bubble bubble-two"><PackageCheck size={23} /></span>
          <span className="help-art-bubble bubble-three"><Truck size={24} /></span>
        </div>
      </section>

      <section className="help-section help-categories">
        <div className="help-section-heading">
          <div><span className="help-eyebrow">KHÁM PHÁ</span><h2>Bạn đang cần hỗ trợ về?</h2></div>
          <p>Chọn chủ đề để tìm đúng thông tin nhanh hơn.</p>
        </div>
        <div className="help-category-grid">
          {categories.map(({ name, description, icon: Icon, target }) => (
            <a className="help-category-card" href={`#${target}`} key={name}>
              <span className="help-category-icon"><Icon size={22} /></span>
              <span className="help-category-copy"><strong>{name}</strong><small>{description}</small></span>
              <ArrowRight className="help-category-arrow" size={18} />
            </a>
          ))}
        </div>
      </section>

      <section className="help-section help-guide" id="guide">
        <div className="help-section-heading">
          <div><span className="help-eyebrow">HƯỚNG DẪN NHANH</span><h2>Bắt đầu chỉ với vài bước</h2></div>
          <p>Từ tạo tài khoản đến nhận lại quần áo sạch thơm.</p>
        </div>
        <div className="help-steps">
          <article className="help-step"><span className="help-step-number">01</span><span className="help-step-icon"><BookOpen size={22} /></span><h3>Tạo tài khoản</h3><p>Đăng ký, xác thực email nếu được yêu cầu và đăng nhập vào hệ thống.</p></article>
          <article className="help-step"><span className="help-step-number">02</span><span className="help-step-icon"><Search size={22} /></span><h3>Chọn cửa hàng</h3><p>Tìm cửa hàng phù hợp, xem dịch vụ, đơn giá và khu vực phục vụ.</p></article>
          <article className="help-step"><span className="help-step-number">03</span><span className="help-step-icon"><CalendarCheck size={22} /></span><h3>Đặt lịch nhận đồ</h3><p>Chọn dịch vụ, địa chỉ và khung giờ; kiểm tra kỹ thông tin đơn hàng.</p></article>
          <article className="help-step"><span className="help-step-number">04</span><span className="help-step-icon"><PackageCheck size={22} /></span><h3>Theo dõi đơn hàng</h3><p>Kiểm tra trạng thái xử lý và giao nhận trong mục Đơn hàng của tôi.</p></article>
        </div>
      </section>

      <section className="help-section help-faq" id="faq">
        <div className="help-section-heading">
          <div><span className="help-eyebrow">FAQ</span><h2>Câu hỏi thường gặp</h2></div>
          <p>Câu trả lời cho những vấn đề khách hàng thường quan tâm.</p>
        </div>
        <div className="help-faq-layout">
          <aside className="help-faq-sidebar">
            <strong>Danh mục câu hỏi</strong>
            {["Tất cả", ...Array.from(new Set(helpItems.map((item) => item.category)))].map((category) => (
              <button type="button" key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}<span>{category === "Tất cả" ? helpItems.length : helpItems.filter((item) => item.category === category).length}</span></button>
            ))}
          </aside>
          <div className="help-faq-list" aria-live="polite">
            {filteredItems.length ? filteredItems.map((item) => (
              <article className={openQuestion === item.question ? "help-faq-item open" : "help-faq-item"} key={item.question}>
                <button type="button" aria-expanded={openQuestion === item.question} onClick={() => setOpenQuestion(openQuestion === item.question ? null : item.question)}>
                  <span>{item.question}</span><ChevronDown size={19} />
                </button>
                {openQuestion === item.question && <p>{item.answer}</p>}
              </article>
            )) : <div className="help-empty"><CircleHelp size={28} /><strong>Chưa tìm thấy câu trả lời phù hợp</strong><p>Thử từ khóa khác hoặc chọn danh mục “Tất cả”.</p><button type="button" onClick={() => { setSearch(""); setActiveCategory("Tất cả"); }}>Xóa bộ lọc</button></div>}
          </div>
        </div>
      </section>

      <section className="help-section help-policies" id="policies">
        <div className="help-section-heading">
          <div><span className="help-eyebrow">MINH BẠCH & AN TOÀN</span><h2>Chính sách và bản quyền</h2></div>
          <p>Vui lòng đọc kỹ các nguyên tắc trước khi sử dụng dịch vụ.</p>
        </div>
        <div className="help-policy-grid">
          <article className="help-policy-card"><span><ShieldCheck size={22} /></span><h3>Quyền riêng tư</h3><p>Thông tin tài khoản, địa chỉ và đơn hàng chỉ nên được cung cấp chính xác và sử dụng cho mục đích vận hành dịch vụ. Không chia sẻ mật khẩu hoặc mã xác thực cho người khác.</p><small>Khuyến nghị bảo mật tài khoản</small></article>
          <article className="help-policy-card"><span><CalendarCheck size={22} /></span><h3>Đặt lịch và hủy đơn</h3><p>Kiểm tra cửa hàng, dịch vụ, đơn giá, địa chỉ và thời gian trước khi xác nhận. Điều kiện hủy đơn phụ thuộc trạng thái đơn hàng và chính sách chính thức đang áp dụng.</p><small>Kiểm tra điều kiện trước khi hủy</small></article>
          <article className="help-policy-card"><span><CreditCard size={22} /></span><h3>Thanh toán và hoàn tiền</h3><p>Chỉ thanh toán qua phương thức hiển thị trong hệ thống. Điều kiện, số tiền và thời gian hoàn tiền cần căn cứ vào trạng thái giao dịch cùng chính sách của đơn vị vận hành.</p><small>Lưu lại thông tin giao dịch khi cần hỗ trợ</small></article>
          <article className="help-policy-card"><span><CheckCircle2 size={22} /></span><h3>Điều khoản sử dụng</h3><p>Người dùng cần cung cấp thông tin trung thực, sử dụng hệ thống đúng mục đích và không thực hiện hành vi gây gián đoạn hoặc ảnh hưởng đến người dùng khác.</p><small>Sử dụng dịch vụ có trách nhiệm</small></article>
        </div>
        <div className="help-copyright"><ShieldCheck size={19} /><p><strong>Bản quyền Laundry Booking</strong><br />Giao diện, nội dung và các thành phần của hệ thống thuộc quyền quản lý của đơn vị phát triển/vận hành tương ứng. Không sao chép hoặc sử dụng lại khi chưa có sự cho phép cần thiết. Các nội dung trên trang này mang tính hướng dẫn; chính sách chính thức do đơn vị vận hành công bố sẽ được ưu tiên áp dụng.</p></div>
      </section>

      <section className="help-contact" id="contact">
        <div className="help-contact-icon"><MessageCircle size={26} /></div>
        <div className="help-contact-copy"><span className="help-eyebrow">CHÚNG TÔI LUÔN SẴN SÀNG LẮNG NGHE</span><h2>Vẫn cần hỗ trợ thêm?</h2><p>Hãy chuẩn bị email tài khoản, mã đơn hàng (nếu có) và mô tả vấn đề để đội ngũ hỗ trợ có thể kiểm tra nhanh hơn.</p></div>
        <div className="help-contact-action"><span><Mail size={17} /> Kênh liên hệ chính thức</span><small>Thông tin email và số điện thoại cần được cập nhật bởi đơn vị vận hành trước khi phát hành.</small></div>
      </section>

      <footer className="help-footer">
        <Link className="help-footer-brand" to="/login"><WashingMachine size={19} /> Laundry Booking</Link>
        <span>© {new Date().getFullYear()} Laundry Booking. All rights reserved.</span>
        <a href="#policies">Chính sách & bản quyền <ArrowRight size={14} /></a>
      </footer>
    </main>
  );
}
