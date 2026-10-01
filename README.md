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
```

Build web tĩnh: `npx expo export --platform web` (kết quả nằm trong `dist/`).

## Cấu trúc thư mục

```
app/                 Màn hình (Expo Router)
  _layout.tsx        Font, AuthProvider, chặn route theo trạng thái đăng nhập
  login.tsx
  (app)/_layout.tsx  Tabs: bottom tab < 768px, sidebar ≥ 768px
  (app)/…            Trang chủ, Hợp đồng, Thanh toán, Phiếu thu, Cá nhân, Thông báo
components/ui/       Button, Input, Card, Badge, ProgressBar, Skeleton, EmptyState, ErrorState, ScreenHeader…
components/layout/   Screen (container tối đa 1100px), AppNavigation, Logo, ResponsiveGrid
components/domain/   Thẻ hợp đồng, đợt thanh toán, phiếu thu, thông báo…
theme/               Design system: tokens.json (màu, bo góc, cỡ chữ), shadows, typography, fonts
types/               Interface: User, Contract, PaymentInstallment, Receipt, AppNotification
data/mock/           Dữ liệu giả – CHỈ được đọc bởi services/
services/            Lớp truy cập dữ liệu (hàm async)
hooks/               useContracts, useContract, usePaymentSchedule, useReceipts, useBreakpoint…
lib/                 format.ts (tiền, ngày), payment.ts (tổng đã trả, %, số ngày còn lại), labels…
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
4. Trong `services/authService.ts`: thay `login`, `logout`, `getCurrentUser` bằng API xác thực và đặt
   `demoAccountHint = null` để ẩn gợi ý tài khoản demo ở màn đăng nhập.
5. Khi không còn dùng mock: xóa `data/mock/` và `services/mockLatency.ts`.

Khi có lỗi, ném `ServiceError` với thông điệp tiếng Việt — màn hình sẽ tự hiển thị `ErrorState` kèm nút “Thử lại”.

## Giao diện

- Màu chủ đạo cam `#F08A24` (thang 50–900), xanh lá (thành công), xanh dương (thông tin), đỏ (cảnh báo), thang xám.
- Bo góc 12 / 16 / 24, đổ bóng nhẹ, font Be Vietnam Pro + Noto Sans (đủ dấu tiếng Việt, qua `expo-font`), light mode.
- Quy chuẩn đầy đủ: `design-system/beesky/MASTER.md` và `design-system/beesky/pages/`.
- Token khai báo một lần trong `theme/tokens.json`, dùng chung cho `tailwind.config.js` (NativeWind) và style TypeScript.
