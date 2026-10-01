@AGENTS.md

# BeeSky – Ứng dụng khách hàng

Ứng dụng giúp khách hàng bất động sản tra cứu **hợp đồng**, **lịch thanh toán** và **phiếu thu**.
Chạy trên iOS, Android và Web với cùng một giao diện. Toàn bộ chữ hiển thị bằng **tiếng Việt**.

## Stack

- Expo SDK 57, React Native 0.86, React 19, TypeScript (strict)
- Expo Router (routes nằm ở `app/` ở gốc dự án — dự án này **không** dùng `src/app/`)
- react-native-web + `@expo/metro-runtime` (web xuất tĩnh), NativeWind v4 + Tailwind 3
- Font: **chỉ Be Vietnam Pro** (400/500/600/700) qua `expo-font`; icon: **lucide-react-native** qua `<Icon name>` (tên ngữ nghĩa trong `theme/icons.ts`)
- AsyncStorage cho phiên đăng nhập; **chưa có backend** — dữ liệu giả trong `data/mock/`

Lệnh: `npm run web` · `npm run ios` · `npm run android` · `npm run lint` · `npm run typecheck` · `npm test` (tương phản màu) · `npm run audit:ui` · `npx expo export --platform web`.
Trong môi trường không truy cập được api.expo.dev, thêm `EXPO_OFFLINE=1` trước `npx expo install` / `npx expo export`.

## Cấu trúc

```
app/                 Màn hình (Expo Router). (app)/ là nhóm cần đăng nhập
components/ui/       Component nền tảng (Button, Input, Card, Badge, Text, Icon…)
components/layout/   Screen, AppNavigation (thanh tab kính nổi / sidebar), AuthLayout, Logo, Section, Grid/Col
components/domain/   Thẻ nghiệp vụ (ContractCard, InstallmentTimeline, ReceiptCard…)
theme/               Design token — tokens.json là nguồn duy nhất (dùng chung với tailwind.config.js)
types/               Interface domain
data/mock/           Dữ liệu giả — CHỈ services/ được đọc
services/            Lớp truy cập dữ liệu (async)
hooks/               Hook gọi services (useContracts, useReceipts…)
lib/                 Logic thuần: định dạng, tính toán thanh toán, nhãn trạng thái
contexts/            AuthContext
design-system/beesky/ MASTER.md + pages/*.md — quy chuẩn giao diện
```

## Kiến trúc dữ liệu (bắt buộc)

- Luồng: **màn hình → hooks → services → (mock hoặc API thật)**.
- Màn hình và component **chỉ** gọi hooks (`hooks/`) hoặc services (`services/`). **Tuyệt đối không import `data/mock/`** ngoài `services/`.
- Mỗi hàm service là `async`, có comment `// TODO: thay bằng gọi API/database thật`, ném `ServiceError` với thông điệp tiếng Việt khi lỗi.
- Logic tính toán (tổng đã trả, phần trăm, số ngày còn lại, trạng thái đợt, sắp xếp, lọc) đặt ở `lib/` hoặc `services/`, **không** viết trong component.
- Định dạng tiền/ngày luôn qua `lib/format.ts` (`2.500.000.000 đ`, `dd/MM/yyyy`).

## Quy tắc code

- TypeScript strict, **không dùng `any`** (kể cả `as any`); ưu tiên `unknown` + type guard.
- Không viết mã hex, `rgba()` hay số pixel trực tiếp ngoài `theme/`. Dùng token: `semantic`, `colors`, `toneColors`, `spacing`, `radius`, `sizes`, `shadows`, `layout`, `opacity`, `motion`. Với NativeWind dùng thang spacing token (`gap-ms`, `p-md`, `mb-sm`…).
- Chữ luôn qua `<Text variant>` (`components/ui/Text.tsx`); icon luôn qua `<Icon>` / `<IconButton>`; không dùng emoji làm icon.
- Kiểm tra nhanh trước khi commit:
  ```bash
  grep -rnE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" app components hooks lib contexts services --include=*.ts --include=*.tsx
  grep -rnE "\b(width|height|padding\w*|margin\w*|gap|borderRadius|fontSize|top|right|bottom|left|size)(=\{|: )-?[1-9]" app components --include=*.tsx
  grep -rn "data/mock" app components hooks contexts lib
  ```
  Cả ba lệnh phải không trả về kết quả.

## Quy trình BẮT BUỘC cho mọi việc về giao diện

Áp dụng cho mọi thay đổi ảnh hưởng tới cách màn hình trông hoặc tương tác (màn mới, sửa component, đổi màu, bố cục…):

1. **Đọc `design-system/beesky/MASTER.md`.**
2. **Đọc `design-system/beesky/pages/<màn>.md` nếu có** (login, register, forgot-password, home, contracts, contract-detail, receipts, payments, profile). File page **ưu tiên hơn** Master. Màn mới chưa có file → tạo file page chỉ ghi điểm khác Master.
3. **Tra cứu skill `ui-ux-pro-max`** (`.claude/skills/ui-ux-pro-max/SKILL.md`) cho vấn đề cụ thể, mỗi truy vấn một ý, 2–5 từ khóa:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<vấn đề UX>" --domain ux
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<vấn đề triển khai>" --stack react-native
   ```
   Kết quả của skill chỉ là khuyến nghị: **mockup/MASTER.md thắng khi mâu thuẫn** (màu cam `#F08A24`, nền sáng, thẻ trắng bo góc, badge pastel, thanh tiến độ, timeline). Không dùng `--design-system --persist --force` để ghi đè MASTER.md.
4. Triển khai bằng token và component sẵn có; nếu cần giá trị mới, thêm vào `theme/tokens.json` và ghi vào MASTER.md.
5. **Tự kiểm tra checklist ở MASTER.md §13** (hình ảnh, tương tác, trạng thái dữ liệu, bố cục 375/768/1024/1440, trợ năng, kỹ thuật) và chạy:
   ```bash
   npx tsc --noEmit && npx expo lint && npm test && npx expo export --platform web
   ```
   **chỉ tạo pull request khi tất cả đều đạt**; ghi kết quả kiểm tra vào mô tả PR.
