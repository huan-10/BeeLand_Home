# BeeSky – Ứng dụng khách hàng

Ứng dụng giúp khách hàng bất động sản tra cứu **hợp đồng**, **lịch thanh toán** và **phiếu thu**.
Xây dựng bằng Expo SDK 57 + TypeScript + Expo Router + NativeWind, chạy trên iOS, Android và Web với cùng một giao diện.

> Giai đoạn hiện tại dùng **dữ liệu giả (mock)**, không cần Supabase hay backend.
> Tài khoản demo: `demo@beesky.vn` (hoặc số `0901 234 567`) / `123456`.

## Chạy ứng dụng

```bash
npm install

npm run web       # mở trên trình duyệt (npx expo start --web)
npm run ios       # iOS Simulator / Expo Go
npm run android   # Android Emulator / Expo Go
npm start         # dev server, quét QR bằng Expo Go trên điện thoại

npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # test tương phản màu (node:test, đọc theme/tokens.json)
npm run audit:ui   # kiểm định giao diện web (xem mục "Kiểm định")
npx expo-doctor    # kiểm tra phiên bản thư viện / cấu hình Expo
```

Build web tĩnh: `npx expo export --platform web` (kết quả nằm trong `dist/`).

## Màn hình

| Đường dẫn | Nội dung |
|---|---|
| `/login`, `/register`, `/forgot-password` | Đăng nhập (ghi nhớ phiên), đăng ký, quên mật khẩu — chỉ khi chưa đăng nhập |
| `/` | Trang chủ: lời chào, banner, 4 lối tắt, đợt thanh toán gần nhất, thông báo mới |
| `/contracts`, `/contracts/[id]` | Danh sách hợp đồng (lọc + tìm theo mã) và chi tiết (lịch thanh toán, phiếu thu, thông tin khác, xem PDF mẫu, "Thanh toán ngay") |
| `/payments` | Các đợt thanh toán của **mọi hợp đồng**, nhóm theo tháng, sắp theo ngày; cảnh báo đợt quá hạn (chữ + icon); lọc Sắp đến hạn / Đã thanh toán / Tất cả |
| `/receipts`, `/receipts/[id]` | Phiếu thu (lọc theo trạng thái / hợp đồng), chi tiết + tải PDF / chia sẻ (giao diện) |
| `/profile` | Thông tin tài khoản, đổi mật khẩu (giao diện), lối tắt, đăng xuất (có xác nhận), phiên bản ứng dụng |
| `/notifications` | Thông báo, đánh dấu đã đọc |

Mọi danh sách đều có 3 trạng thái **đang tải (skeleton) / rỗng / lỗi + "Thử lại"**; màn hình chính hỗ trợ kéo để làm mới.

## Cấu trúc thư mục

```
app/                 Màn hình (Expo Router)
  _layout.tsx        Font, AuthProvider, chặn route theo trạng thái đăng nhập
  login.tsx
  (app)/_layout.tsx  Tabs: bottom tab < 768px, sidebar ≥ 768px
  (app)/…            Trang chủ, Hợp đồng, Thanh toán, Phiếu thu, Cá nhân, Thông báo
components/ui/       Button, Input, Card, MoneySummaryCard, KeyValueRow, Badge, Chip, Tabs, DataTable, Dialog, Toast, ProgressBar…
components/layout/   Screen (container tối đa 1100px), AppNavigation (thanh tab kính nổi / sidebar + skip link), AuthLayout, Grid/Col
components/domain/   Thẻ hợp đồng, đợt thanh toán, phiếu thu, thông báo…
theme/               Design system: tokens.json (màu, vai trò màu, bo góc, cỡ chữ), shadows, typography, fonts, icons
tests/               Test tương phản màu
types/               Interface: User, Contract, PaymentInstallment, Receipt, AppNotification
data/mock/           Dữ liệu giả – CHỈ được đọc bởi services/
services/            Lớp truy cập dữ liệu (hàm async)
hooks/               useContracts, useContract, usePaymentSchedule, useReceipts, useBreakpoint, useHover…
lib/                 format.ts (tiền, ngày), payment.ts (tổng đã trả, %, số ngày, nhóm theo tháng), validation.ts, labels…
scripts/ui-audit.js  Kiểm định giao diện web tự động (Playwright)
design-system/       Quy chuẩn giao diện: beesky/MASTER.md + pages/<màn hình>.md
contexts/            AuthContext (phiên lưu bằng AsyncStorage)
```

Luồng dữ liệu: **Màn hình → hooks → services → (mock hoặc API thật)**.
Màn hình không bao giờ import trực tiếp từ `data/mock/`; logic tính toán nằm ở `lib/`.

## Cách thay dữ liệu thật

Chỉ cần sửa thư mục **`services/`** — giao diện, hooks và types giữ nguyên.

1. Mở từng file trong `services/` và tìm comment `// TODO: thay bằng gọi API/database thật`.
2. Thay phần đọc `data/mock/…` + `simulateLatency()` bằng lời gọi API / database, giữ nguyên
   chữ ký hàm và kiểu trả về. Ví dụ:

   ```ts
   export async function getContracts(filter: ContractFilter = {}): Promise<ContractListItem[]> {
     const res = await fetch(`${API_URL}/contracts?status=${filter.status ?? 'all'}`, {
       headers: { Authorization: `Bearer ${token}` },
     });
     if (!res.ok) throw new ServiceError('Không tải được danh sách hợp đồng.', 'NETWORK');
     return res.json();
   }
   ```

3. Nếu backend chỉ trả về dữ liệu thô, tiếp tục dùng các hàm trong `lib/payment.ts`
   (`toInstallmentView`, `summarizeContractPayments`) để tính trạng thái, % đã thanh toán, số ngày còn lại.
4. Trong `services/authService.ts`: thay `login`, `register`, `requestPasswordReset`, `changePassword`,
   `logout`, `getCurrentUser` bằng API xác thực và đặt `demoAccountHint = null` để ẩn gợi ý tài khoản demo.
   `changePassword` hiện chỉ kiểm tra mật khẩu hiện tại rồi trả `unavailable` (giao diện đã sẵn sàng).
5. Các chức năng mới có giao diện, chờ nối backend: `startPayment` (cổng thanh toán),
   `exportReceiptPdf` / `shareReceipt` (xuất phiếu thu) — trả về `checkoutUrl` / `url` là màn hình tự mở.
6. Khi không còn dùng mock: xóa `data/mock/` và `services/mockLatency.ts`.

Khi có lỗi, ném `ServiceError` với thông điệp tiếng Việt — màn hình sẽ tự hiển thị `ErrorState` kèm nút “Thử lại”.

## Giao diện

- Phong cách **"Bo tròn – Mật ong & Cà phê"** (bản làm mới 2026-10): cam thương hiệu `#F08A24` cho logo / tiến độ,
  nút chính cam mật ong đậm `#A9520A` chữ trắng (5.4:1), thang xám ấm "cát", màu đậm nâu cà phê `#2B2019` cho thẻ
  tổng tiền, chip/tab đang chọn và toast; badge pastel cho trạng thái.
- Thẻ bo 24–28 nổi bằng bóng ấm 4 mức (soft / raised / overlay / modal) thay cho viền; một font Be Vietnam Pro
  (display 28 / title 22 / heading 17 / body 15 / caption 14 / label 12, số tiền chữ số đều độ rộng); light mode.
- Mobile: thanh tab kính mờ nổi; web ≥ 768px: sidebar + lưới 12 cột.
- Quy chuẩn đầy đủ: `design-system/beesky/MASTER.md` và `design-system/beesky/pages/`.
- Token khai báo một lần trong `theme/tokens.json`, dùng chung cho `tailwind.config.js` (NativeWind) và style TypeScript.
- Không hard-code màu / kích thước ngoài `theme/`; icon dùng lucide-react-native qua `<Icon name>`, không dùng emoji.
- `npm test` kiểm 72 cặp tương phản WCAG trực tiếp trên `theme/tokens.json`.

## Kiểm định (accessibility & responsive)

Quy chuẩn và checklist: `design-system/beesky/MASTER.md` §10–§13. Đã áp dụng:

- Vùng chạm tối thiểu 44×44 (`sizes.touchTarget`, `sizes.control.sm`) — không dựa vào `hitSlop`.
- Tương phản chữ ≥ 4.5:1 (bảng tương phản trong MASTER §1.4), trạng thái không chỉ dựa vào màu (luôn có chữ + icon).
- Web: hover / pressed / focus-visible cho mọi phần tử bấm được (`useHover`), duyệt bàn phím đầy đủ
  (Tab, Enter, mũi tên trong nhóm tab, Esc đóng hộp thoại, giữ focus trong hộp thoại), link "Bỏ qua tới nội dung chính".
- Tôn trọng "giảm chuyển động" (`prefers-reduced-motion` / Reduce Motion của hệ điều hành): tắt hiệu ứng vào màn,
  chuyển trang và hộp thoại.
- Chữ và badge xuống dòng thay vì bị cắt ở 375 / 768 / 1024 / 1440px.

Chạy kiểm định tự động (cần Playwright + Chromium):

```bash
npx expo start --web --port 8081   # cửa sổ 1
npm run audit:ui                   # cửa sổ 2 — BASE_URL, WIDTHS để tùy chỉnh
```

Script đăng nhập bằng tài khoản demo, duyệt mọi màn hình ở 4 độ rộng và báo: vùng chạm < 44px, tương phản < 4.5:1,
chữ bị cắt, tràn ngang, thiếu con trỏ / hover / vòng focus, lỗi console. Thoát với mã 1 khi còn lỗi.
