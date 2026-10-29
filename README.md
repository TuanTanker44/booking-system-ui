# Laundry Booking — UI

Frontend React + TypeScript + Vite của Laundry Booking System, gọi API backend (NestJS) thật. Giao diện responsive theo phong cách xanh dương/trắng, gồm khu vực Customer (đặt lịch giặt, đơn hàng, địa chỉ, tài khoản), khu vực Admin (quản lý người dùng) và khu vực Staff (đang phát triển).

## Chạy dự án

Yêu cầu Node.js 20+, pnpm và một backend API đang chạy.

Tạo `.env.local` từ file mẫu rồi điền giá trị (`.env.local` đã nằm trong `.gitignore`):

```bash
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
```

| Biến | Dùng cho |
| --- | --- |
| `VITE_API_URL` | Địa chỉ backend API, ví dụ `http://localhost:3000` |
| `NGROK_AUTHTOKEN` | Chỉ cần khi chạy `pnpm dev` (mở tunnel ngrok cho frontend) |
| `TEST_EMAIL`, `TEST_PASSWORD` | Tài khoản CUSTOMER dùng cho test E2E, xem phần [Kiểm thử E2E](#kiểm-thử-e2e-với-selenium) |

Cài đặt và chạy:

```bash
pnpm install
pnpm dev
```

`pnpm dev` chạy Vite ở cổng 5173 và mở tunnel ngrok để truy cập từ bên ngoài (cần `NGROK_AUTHTOKEN`). Nếu chỉ cần chạy cục bộ: `pnpm exec vite --port 5173`.

## Các màn hình

Dữ liệu lấy từ API backend (thêm/sửa/xóa đều gọi API, không còn dữ liệu mock).

**Công khai**
- Đăng nhập, đăng ký (có ngày sinh), xác minh email, quên/đặt lại mật khẩu.
- Trợ giúp & hỗ trợ (`/help`), kết quả thanh toán (`/payment/result`), 403, 404.

**Customer** (`/customer/dashboard`, các tab là state nội bộ của trang)
- Trang chủ: tìm kiếm, danh sách cửa hàng, cửa hàng bán chạy theo khu vực, CTA đặt lịch.
- Đặt lịch giặt: chọn cửa hàng, dịch vụ/số lượng, thời gian (khung giờ khả dụng lấy từ API) và địa chỉ, xem báo giá, xác nhận đơn.
- Thanh toán: tạo thanh toán online qua VNPay hoặc MoMo, hoặc chọn thanh toán sau.
- Đơn hàng: danh sách, lọc/tìm kiếm, xem chi tiết và tiến trình, hủy đơn.
- Địa chỉ: xem, thêm, sửa, đặt mặc định, xóa; hỗ trợ lấy vị trí hiện tại.
- Tài khoản: cập nhật thông tin cá nhân, đổi mật khẩu, đăng xuất.
- Responsive: sidebar trên desktop, bottom navigation trên mobile.

**Admin** (`/admin/users`): quản lý người dùng.

**Staff** (`/staff`): trang chờ, khu vực quản lý cho nhân viên đang được phát triển.

## Kiểm thử E2E với Selenium

Bộ test E2E nằm trong `tests/e2e/`, dùng [Selenium WebDriver](https://www.selenium.dev/documentation/webdriver/) điều khiển Chrome, [Mocha](https://mochajs.org/) làm test runner và [Chai](https://www.chaijs.com/) để assert. Toàn bộ là ES module (`"type": "module"`).

### Yêu cầu

- Node.js 20+ và pnpm (`pnpm install` đã cài `selenium-webdriver`, `mocha`, `chai`).
- Google Chrome. Selenium Manager đi kèm `selenium-webdriver` tự tải ChromeDriver phù hợp với phiên bản Chrome, không cần cài thủ công.
- Backend API đang chạy và có sẵn dữ liệu cửa hàng/dịch vụ cho test đặt lịch.
- Một tài khoản **CUSTOMER** đã xác minh email, chỉ dùng cho test. Các test đăng nhập sẽ thao tác thật trên tài khoản này (đặt lịch, thêm địa chỉ, đổi tên profile), vì vậy không dùng tài khoản thật của người dùng.

### Cấu hình

Test đọc các biến môi trường sau:

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `BASE_URL` | `http://localhost:5173` | Địa chỉ frontend đang chạy |
| `API_URL` | `http://localhost:3000` | Địa chỉ backend, dùng để dọn dữ liệu sau test; nên trùng `VITE_API_URL` |
| `TEST_EMAIL` | _(xem lưu ý bên dưới)_ | Email tài khoản CUSTOMER dùng để test |
| `TEST_PASSWORD` | _(xem lưu ý bên dưới)_ | Mật khẩu của tài khoản đó |
| `HEADLESS` | `true` | Đặt `false` để xem trình duyệt chạy |

Thêm `TEST_EMAIL`, `TEST_PASSWORD` (và `API_URL` nếu khác mặc định) vào `.env.local`. File này đã nằm trong `.gitignore` nên không bị commit. Mocha không tự đọc `.env.local`; dùng một trong hai cách ở phần "Chạy test".

> Không commit email/mật khẩu thật vào mã nguồn. Hiện `tests/e2e/helpers/auth.js` còn giá trị mặc định cho `TEST_EMAIL` và `TEST_PASSWORD`; nên xóa chúng và luôn truyền qua biến môi trường.

### Chạy test

1. Chạy backend, sau đó chạy frontend ở terminal khác (cần Vite ở cổng 5173):

   ```bash
   pnpm exec vite --port 5173
   ```

   `pnpm dev` cũng được, nhưng nó mở thêm tunnel ngrok và cần `NGROK_AUTHTOKEN`.

2. Chạy toàn bộ test:

   ```bash
   # Nạp biến từ .env.local (Node 20.6+)
   pnpm exec node --env-file=.env.local node_modules/mocha/bin/mocha.js "tests/e2e/specs/**/*.spec.js" --timeout 60000
   ```

   Hoặc đặt biến trực tiếp rồi dùng script có sẵn:

   ```powershell
   # PowerShell
   $env:TEST_EMAIL = "customer.test@example.com"
   $env:TEST_PASSWORD = "mat-khau-test"
   pnpm run test:e2e
   ```

   ```bash
   # Git Bash / macOS / Linux
   TEST_EMAIL=customer.test@example.com TEST_PASSWORD='mat-khau-test' pnpm run test:e2e
   ```

3. Một số lệnh hay dùng (thêm sau `mocha.js`, hoặc sau `pnpm run test:e2e --`):

   ```bash
   # Chỉ một file spec
   pnpm exec mocha tests/e2e/specs/01.public.spec.js --timeout 60000

   # Chỉ test có tên khớp
   pnpm exec mocha "tests/e2e/specs/**/*.spec.js" --timeout 60000 --grep "login"

   # Xem trình duyệt khi chạy (PowerShell: $env:HEADLESS="false")
   HEADLESS=false pnpm run test:e2e

   # Chỉ kiểm tra danh sách test, không mở trình duyệt
   pnpm exec mocha "tests/e2e/specs/**/*.spec.js" --dry-run
   ```

### Cấu trúc thư mục

```
tests/e2e/
├── helpers/    # driver.js (tạo Chrome, BASE_URL/API_URL), auth.js (login/logout),
│               # text.js, form.js, dialog.js (đóng hộp thoại vị trí), cleanup.js (dọn dữ liệu qua API)
├── pages/      # Page Object: mỗi trang một class, gói selector và thao tác
└── specs/      # Kịch bản test, đánh số theo thứ tự chạy
    ├── 01.public.spec.js      # login, đăng ký, quên/đặt lại mật khẩu, /help, 404, redirect
    ├── 02.auth.spec.js        # đăng nhập, sai mật khẩu, phân quyền
    ├── 03.dashboard.spec.js   # 5 tab của dashboard khách hàng
    ├── 04.booking.spec.js     # đặt lịch (tự mang đến cửa hàng) + hủy đơn sau test
    ├── 05.orders.spec.js      # lọc, tìm kiếm, chi tiết đơn
    ├── 06.addresses.spec.js   # thêm địa chỉ + xóa sau test
    ├── 07.profile.spec.js     # validate mật khẩu, đổi thông tin, đăng xuất
    └── 08.responsive.spec.js  # bottom navigation trên mobile
```

### Viết test mới

1. Tạo class trong `tests/e2e/pages/` cho trang cần test. Selector nên dùng `id`, `role` hoặc class ổn định (ví dụ `input#email`, `button.auth-submit`), tránh dựa vào văn bản dễ đổi.
2. Tạo file `NN.ten.spec.js` trong `tests/e2e/specs/`. Mỗi file tạo một driver trong `before` và `quit()` trong `after`:

   ```js
   import { expect } from 'chai';
   import { createDriver } from '../helpers/driver.js';
   import { login } from '../helpers/auth.js';
   import { dismissLocationDialog } from '../helpers/dialog.js';
   import DashboardPage from '../pages/dashboard.page.js';

   describe('Tên nhóm test', function () {
     let driver;
     before(async function () {
       driver = await createDriver();
       await login(driver);
       await dismissLocationDialog(driver);
     });
     after(async function () { await driver.quit(); });

     it('mô tả hành vi mong đợi', async function () {
       const dash = new DashboardPage(driver);
       expect(await dash.isLoaded()).to.be.true;
     });
   });
   ```

3. Import theo ESM, bắt buộc có đuôi `.js` (ví dụ `'../helpers/driver.js'`). Không dùng `require` hay `module.exports`.
4. Test tạo dữ liệu (đặt lịch, địa chỉ) phải dọn lại bằng `helpers/cleanup.js` trong `after`.

### Xử lý sự cố

- **`Cannot find module '.../selenium-webdriver/chrome'`**: import thiếu đuôi `.js`. Dùng `selenium-webdriver/chrome.js`.
- **`does not provide an export named ...`**: import named từ file chỉ có `export default` (hoặc ngược lại). Kiểm tra dòng `export` ở cuối file được import.
- **`tab crashed`, Chrome không mở được**: thử `HEADLESS=false`, cập nhật Chrome, hoặc đóng các cửa sổ Chrome/ChromeDriver còn sót.
- **Các test sau đăng nhập bị timeout ở `/customer/dashboard`**: kiểm tra backend đang chạy, `VITE_API_URL` và `API_URL` đúng, tài khoản test là CUSTOMER và đã xác minh email.
- **Test không tìm thấy phần tử**: chạy với `HEADLESS=false` để xem trang thực tế, kiểm tra hộp thoại xin quyền vị trí có đang chặn thao tác không.
- **Dữ liệu test còn sót** (đơn hoặc địa chỉ không bị dọn do test fail giữa chừng): xóa thủ công trong tài khoản test.

## Tích hợp backend

Ứng dụng gọi API qua một axios instance dùng chung ở `src/lib/axios.ts` (`baseURL` lấy từ `VITE_API_URL`). Mỗi nhóm API có một service trong `src/services/`:

| Service | Chức năng |
| --- | --- |
| `auth.ts` | đăng nhập, đăng ký, đăng xuất, xác minh email, quên/đặt lại mật khẩu, `GET /users/me` |
| `user.ts` | danh sách và cập nhật người dùng (Admin) |
| `store.ts`, `store-booking.ts` | cửa hàng, cửa hàng bán chạy, dịch vụ và khung giờ khả dụng của cửa hàng |
| `booking.ts` | báo giá, tạo/xem/hủy/cập nhật đơn |
| `address.ts` | CRUD địa chỉ, đặt mặc định |
| `payment.ts` | tạo thanh toán online (VNPay, MoMo), danh sách thanh toán |

Xác thực:
- Đăng nhập trả về access token, lưu trong store (`src/stores/user.ts`) và `localStorage`; refresh token nằm trong cookie (`withCredentials: true`, nên backend cần bật CORS cho phép credentials).
- Khi API trả 401, axios interceptor gọi `POST /auth/refresh` một lần rồi gửi lại request; refresh thất bại thì xóa phiên và đưa về `/login`.
- `ProtectedRoute` trong `src/router/guards.tsx` chặn theo role (`CUSTOMER`, `STAFF`, `ADMIN`); sai role chuyển tới `/forbidden`.

Nguyên tắc khi mở rộng:
- Tiền cọc, phí giao nhận và tổng tiền do backend tính (`POST /bookings/quote`); không tin số tiền do client gửi lên.
- Khung giờ khả dụng lấy từ API của cửa hàng, không tự suy ra ở client.
- Màn hình nào gọi API đều cần xử lý đủ trạng thái loading, lỗi và rỗng.
- Trạng thái đơn hàng phải khớp enum của backend; cân nhắc polling hoặc WebSocket/SSE nếu cần cập nhật thời gian thực.

## Công cụ

- Dự án dùng [React Compiler](https://react.dev/learn/react-compiler) (qua `babel-plugin-react-compiler`), nên build và dev server chậm hơn một chút.
- Lint: `pnpm lint` (ESLint, cấu hình ở `eslint.config.js`). Build: `pnpm build` (chạy `tsc -b` rồi `vite build`).
