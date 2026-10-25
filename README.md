# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Laundry Booking — Customer UI

Giao diện mẫu React + TypeScript cho khu vực Customer của Laundry Booking System. Thiết kế responsive theo phong cách xanh dương/trắng, sử dụng React state và dữ liệu mock để demo luồng đặt lịch.

## Chạy dự án

Yêu cầu Node.js 20+ và pnpm/npm.

```bash
pnpm install
pnpm dev
```

Hoặc:

```bash
npm install
npm run dev
```

## Các màn hình

- Trang chủ: dịch vụ, cửa hàng, ưu điểm và CTA đặt lịch.
- Đặt lịch giặt: chọn cửa hàng, chọn dịch vụ/số lượng, chọn thời gian và địa chỉ, chọn phương thức thanh toán, xác nhận.
- Đơn hàng: lọc/tìm kiếm đơn, xem chi tiết và tiến trình trạng thái.
- Địa chỉ: xem, thêm, đặt địa chỉ mặc định, xóa (dữ liệu demo).
- Tài khoản: cập nhật thông tin cá nhân (dữ liệu demo).
- Responsive: sidebar desktop, bottom navigation mobile.

## Cài vào frontend hiện có

Có thể copy `src/App.tsx` và `src/styles.css` vào frontend hiện tại, sau đó bảo đảm đã cài `lucide-react`. `main.tsx` và `index.html` chỉ cần nếu dùng như ứng dụng Vite độc lập.

## Lưu ý tích hợp backend

Đây là UI demo, chưa gọi API và chưa có xác thực thực tế. Các thao tác thêm/sửa/xóa, thanh toán, mã ưu đãi, thông báo, đăng xuất và theo dõi thời gian thực hiện đang dùng state cục bộ.

Khi tích hợp NestJS API:

- Tạo `authService`, `bookingService`, `storeService`, `addressService`, `paymentService`.
- Thay dữ liệu mock bằng API, bổ sung loading/error/empty states.
- Tính tiền cọc, phí giao nhận và tổng tiền từ backend; không tin số tiền do client gửi lên.
- Lấy ngày/khung giờ khả dụng từ `store_schedules` và `store_schedule_exceptions`.
- Đồng bộ trạng thái đơn hàng theo enum backend; cân nhắc polling hoặc WebSocket/SSE.
- Bảo vệ các trang Customer bằng route guard và access token theo chiến lược auth của dự án.
