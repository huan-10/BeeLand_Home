# BeeSky – Design System Master

> **QUY TẮC ĐỌC:** Khi làm một màn hình, đọc file này trước, sau đó đọc `design-system/beesky/pages/<màn>.md`.
> Nếu file của màn hình tồn tại, quy tắc trong đó **ghi đè** file Master này. Nếu không có, tuân thủ Master.

**Dự án:** BeeSky – ứng dụng khách hàng bất động sản (hợp đồng, lịch thanh toán, phiếu thu)
**Nền tảng:** Expo SDK 57 + React Native + react-native-web (iOS, Android, Web), NativeWind v4
**Cập nhật:** 2026-10-01 · thay thế bản sinh tự động (teal / Cinzel / Glassmorphism) không khớp thương hiệu

### Nguồn của từng quyết định

| Nhãn | Ý nghĩa |
|------|---------|
| **[Mockup]** | Lấy từ mockup BeeSky — nguồn sự thật về màu và phong cách. Khi skill mâu thuẫn, mockup thắng. |
| **[Skill]** | Lấy từ skill `ui-ux-pro-max` (chỉ những phần không mâu thuẫn mockup). |
| **[Dự án]** | Quyết định kỹ thuật/kiến trúc của dự án (yêu cầu ban đầu hoặc ràng buộc nền tảng). |

**Mã nguồn token:** mọi giá trị dưới đây nằm trong `theme/tokens.json` (dùng chung cho `tailwind.config.js` và `theme/*.ts`). Component **không** được viết mã hex hay số pixel trực tiếp.

---

## 1. Màu sắc — [Mockup]

### 1.1 Thang màu chính (cam BeeSky)

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `primary.50` | `#FEF5EC` | Nền pastel: badge, ô icon, mục điều hướng đang chọn, thông báo chưa đọc |
| `primary.100` | `#FDE7D0` | Viền pastel, vòng sáng focus, avatar |
| `primary.400` | `#F39C45` | Điểm đầu gradient logo |
| **`primary.500`** | **`#F08A24`** | **Màu thương hiệu**: nền nút chính, thanh tiến độ, chip đang chọn, chấm chưa đọc |
| `primary.600` | `#D2700F` | Trạng thái nhấn của nút chính, icon đang chọn |
| `primary.700` | `#AD5A0C` | **Chữ màu cam** (link, số tiền nổi bật, nhãn tab đang chọn), cuối gradient thẻ tổng quan |

### 1.2 Màu theo vai trò (`semantic` trong `theme/colors.ts`)

| Vai trò | Token | Hex |
|---------|-------|-----|
| Nền trang | `semantic.bg` | `#F6F7F9` (xám rất sáng) |
| Thẻ / bề mặt | `semantic.surface` | `#FFFFFF` |
| Bề mặt phụ | `semantic.surfaceMuted` | `#F9FAFB` |
| Viền | `semantic.border` / `borderSubtle` | `#E5E7EB` / `#F3F4F6` |
| Chữ chính | `semantic.text` | `#111827` |
| Chữ phụ | `semantic.textSecondary` | `#374151` |
| Chữ mờ | `semantic.textMuted` | `#6B7280` |
| Chữ cam | `semantic.textBrand` | `#AD5A0C` |
| Chữ trên nền cam | `semantic.textOnPrimary` | `#FFFFFF` |
| Icon trang trí | `semantic.iconMuted` | `#9CA3AF` (không dùng cho chữ) |

### 1.3 Màu trạng thái — badge pastel [Mockup]

Mỗi sắc thái có cặp **nền pastel + chữ đậm cùng tông** (`toneColors` trong `theme/colors.ts`):

| Sắc thái | Nền | Chữ | Đậm (thanh/chấm) | Dùng cho |
|----------|-----|-----|------------------|----------|
| `success` (xanh lá) | `#ECFDF3` | `#166534` | `#16A34A` | Đã thanh toán, đang hiệu lực, phiếu thu |
| `info` (xanh dương) | `#EFF6FF` | `#1D4ED8` | `#3B82F6` | Thông tin, đã hoàn tất, HĐĐC/PGC |
| `danger` (đỏ) | `#FEF2F2` | `#B91C1C` | `#EF4444` | Quá hạn, lỗi, đăng xuất |
| `warning` (vàng cam) | `#FFFBEB` | `#B45309` | `#F59E0B` | Chờ xử lý |
| `primary` (cam) | `#FEF5EC` | `#AD5A0C` | `#F08A24` | Sắp đến hạn |
| `neutral` (xám) | `#F3F4F6` | `#374151` | `#6B7280` | Chưa đến hạn |

### 1.4 Tương phản — [Skill] áp lên màu [Mockup]

Đã đo theo WCAG (`color-contrast`, `color-accessible-pairs`):

| Cặp | Tỷ lệ | Kết luận |
|-----|-------|----------|
| Chữ `primary.700` trên trắng | 4.95:1 | ✅ Dùng cho mọi chữ màu cam |
| Chữ `gray.500` trên trắng / trên nền trang | 4.83 / 4.51:1 | ✅ Chữ mờ tối thiểu |
| Chữ `gray.400` trên trắng | 2.54:1 | ❌ Chỉ dùng cho icon trang trí |
| Chữ badge pastel (6 sắc thái) | 4.6 – 9.4:1 | ✅ |
| **Chữ trắng trên `primary.500`** | **2.51:1** | ⚠️ **Ngoại lệ có chủ đích — xem bên dưới** |

**Ngoại lệ thương hiệu (mockup vs skill):** mockup dùng nút cam `#F08A24` chữ trắng; skill yêu cầu 4.5:1. Theo quy tắc ưu tiên, **giữ màu mockup** và giảm thiểu:
- Nhãn nút luôn **semibold ≥ 14px** và có icon/ngữ cảnh rõ ràng; không đặt chữ thường cỡ nhỏ (caption) trên nền `primary.500`.
- Thẻ tổng quan gradient đi từ `primary.500` → `primary.700` để phần lớn diện tích chữ trắng đạt ≥ 3:1.
- Nếu cần đạt AA tuyệt đối, phương án dự phòng là nền nút `primary.700` (`#AD5A0C`, 4.95:1) — **cần chủ sản phẩm duyệt** vì làm tối màu thương hiệu.

---

## 2. Typography — [Skill] (cặp font) + [Dự án] (thang chữ)

**Cặp font: "Vietnamese Friendly"** — tra từ skill (`--domain typography "vietnamese friendly"`), cả hai đều có subset `vietnamese`, hiển thị đủ dấu (ă, â, ê, ô, ơ, ư, đ và 5 thanh):

| Vai trò | Font | Độ đậm | Token |
|---------|------|--------|-------|
| Tiêu đề (display, h1–h3, logo) | **Be Vietnam Pro** | 600, 700 | `fontFamily.heading.*` |
| Nội dung, nhãn, số liệu | **Noto Sans** | 400, 500, 600, 700 | `fontFamily.body.*` |

Nạp qua `expo-font` với `@expo-google-fonts/be-vietnam-pro` và `@expo-google-fonts/noto-sans` (`theme/fonts.ts`).

**Thang chữ** (`textVariants` trong `theme/typography.ts`, luôn dùng component `<Text variant>`):

| Variant | Cỡ / dòng | Font | Dùng cho |
|---------|-----------|------|----------|
| `display` | 30 / 38 | Be Vietnam Pro 700 | Số tiền lớn (thẻ tổng quan, phiếu thu) |
| `h1` | 24 / 32 | Be Vietnam Pro 700 | Tiêu đề màn hình |
| `h2` | 20 / 28 | Be Vietnam Pro 600 | Tên người dùng, số tiền thẻ |
| `h3` | 18 / 26 | Be Vietnam Pro 600 | Tiêu đề section, tên dự án |
| `body` / `bodyMedium` | 16 / 24 | Noto Sans 400 / 500 | Nội dung, tên đợt thanh toán |
| `small` / `smallMedium` / `label` | 14 / 20 | Noto Sans 400 / 500 / 600 | Mô tả, giá trị InfoRow, nút nhỏ |
| `caption` / `overline` | 12 / 16 | Noto Sans 400 / 600 | Ngày, ghi chú, badge, nhãn tab |

Quy tắc [Skill]: chữ nhỏ nhất 12px; ô nhập ≥ 16px (tránh iOS tự phóng to); line-height ~1.4–1.5; **không tắt** `allowFontScaling`.

---

## 3. Khoảng cách — [Skill]

Nhịp 4/8 (`spacing-scale`). Token `spacing` (cũng là thang spacing của Tailwind: `gap-md`, `p-lg`…):

| Token | px | Dùng cho |
|-------|----|----------|
| `2xs` | 2 | Khoảng cách tiêu đề – phụ đề |
| `xs` | 4 | Icon ↔ chữ nhỏ |
| `sm` | 8 | Icon ↔ chữ, giữa các chip |
| `ms` | 12 | Khoảng cách trong thẻ, giữa các thẻ danh sách |
| `md` | 16 | Padding thẻ, lề mobile |
| `ml` | 20 | Khoảng cách giữa các khối trong màn hình |
| `lg` | 24 | Padding thẻ lớn |
| `xl` | 32 | Lề desktop, padding form desktop |
| `2xl` | 48 | Padding panel thương hiệu, trạng thái rỗng |
| `3xl` | 64 | Dự phòng cho khoảng trắng lớn |

`ms` (12) và `ml` (20) là bổ sung của dự án nằm giữa thang skill, vẫn theo bội số 4.

---

## 4. Bo góc — [Mockup]

| Token | px | Dùng cho |
|-------|----|----------|
| `radius.sm` | 8 | Skeleton dòng chữ |
| `radius.md` | 12 | Nút, ô nhập, ô icon, mục sidebar |
| `radius.lg` | 16 | **Thẻ trắng** (Card), thông báo |
| `radius.xl` | 24 | Thẻ tổng quan gradient |
| `radius.full` | 9999 | Badge, chip, thanh tiến độ, avatar, nút tròn timeline |

## 5. Đổ bóng — [Mockup] (thang nhất quán theo [Skill] `elevation-consistent`)

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `shadows.sm` | `0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)` | Thẻ mặc định |
| `shadows.md` | `0 4px 12px rgba(16,24,40,.08)` | Thẻ tổng quan, thẻ form/phiếu thu |
| `shadows.lg` | `0 12px 32px rgba(16,24,40,.12)` | Modal (dự phòng) |
| `shadows.navTop` | `0 -2px 12px rgba(16,24,40,.04)` | Bottom tab |
| `shadows.focusHalo` | vòng 3px `primary.100` | Ô nhập khi focus |

Thẻ = nền trắng + viền `borderSubtle` 1px + `shadows.sm`. Không dùng glassmorphism/blur trang trí.

---

## 6. Kích thước & vùng chạm — [Skill]

| Token | Giá trị | Quy tắc |
|-------|---------|---------|
| `sizes.touchTarget` | 44 | Mọi phần tử bấm được ≥ 44×44 (iOS), dùng `hitSlop` khi phần nhìn thấy nhỏ hơn |
| `sizes.control` | sm 40 · md 48 · lg 56 | Chiều cao nút/ô nhập (sm + `hitSlop`) |
| `sizes.icon` | xs 12 · sm 16 · md 20 · lg 24 · xl 32 | Không dùng cỡ icon tùy ý |
| `sizes.iconBox` | sm 36 · md 40 · lg 44 · xl 48 · hero 72 | Ô icon pastel (`IconCircle`) |
| `sizes.avatar` | sm 36 · md 44 · lg 64 | Avatar chữ cái đầu |
| `layout.contentMaxWidth` | 1100 | Nội dung desktop căn giữa [Dự án] |
| `layout.sidebarWidth` | 248 | Sidebar desktop [Dự án] |

Khoảng cách tối thiểu giữa hai vùng chạm: 8px (`touch-spacing`).

## 7. Icon — [Skill]

- **Một bộ duy nhất:** Ionicons qua `@expo/vector-icons`, gọi bằng `<Icon name size>` (`components/ui/Icon.tsx`).
- **Outline** cho trạng thái thường, **filled** cho mục đang chọn / trạng thái mạnh (không trộn ở cùng cấp).
- **Không dùng emoji** làm icon.
- Icon trang trí cạnh chữ bị ẩn khỏi trình đọc màn hình (mặc định của `<Icon>`); icon mang nghĩa phải có `accessibilityLabel`; nút chỉ có icon dùng `<IconButton accessibilityLabel>`.

---

## 8. Bố cục & điều hướng — [Dự án] + [Skill]

| Bề rộng | Điều hướng | Nội dung |
|---------|------------|----------|
| < 768px | Bottom tab 5 mục: Trang chủ, Hợp đồng, Thanh toán, Phiếu thu, Cá nhân (icon + nhãn) | Lề `layout.gutterMobile` (16), 1 cột |
| ≥ 768px | Sidebar trái: logo BeeSky, MENU 5 mục, Thông báo, thẻ người dùng + đăng xuất ở đáy | Lề `layout.gutterWide` (32), tối đa 1100px căn giữa, lưới 2–3 cột (`ResponsiveGrid`) |

[Skill]: bottom nav ≤ 5 mục, có nhãn; mục hiện tại được tô (nền `primary.50` + icon filled + chữ `textBrand`); đăng xuất tách khỏi mục điều hướng; nội dung không bị che bởi thanh cố định (safe area); không cuộn ngang trên mobile (chip lọc cuộn ngang trong vùng riêng là ngoại lệ có chủ đích).

---

## 9. Thông số component

| Component | Thông số | Nguồn |
|-----------|----------|-------|
| **Button** | `primary` nền `primary.500`, nhấn `primary.600`, chữ trắng semibold · `secondary` nền `primary.50`, chữ `primary.700`, viền `primary.100` · `ghost` trong suốt, chữ `gray.700` · `danger` nền trắng, chữ `danger.600`, viền `danger.100`. Cao 40/48/56, bo `md`, có `loading` (spinner + `busy`) và `disabled` (opacity 0.5). Mỗi màn hình chỉ 1 nút primary. | [Mockup] màu · [Skill] trạng thái |
| **Input** | Nhãn hiển thị phía trên (không chỉ placeholder), cao 48, viền 1.5px `gray.200` → focus `primary.500` + halo, lỗi `danger.500` + dòng lỗi kèm icon ngay dưới ô (`aria-describedby`, `role="alert"`); nút hiện/ẩn mật khẩu có nhãn. | [Skill] |
| **Card** | Trắng, bo `lg`, viền `borderSubtle`, `shadows.sm`, padding `md`. Bấm được → phản hồi opacity 0.85, **không scale**. | [Mockup] + [Skill] |
| **Badge** | Viên thuốc pastel (§1.3), chữ caption semibold, tùy chọn chấm màu/icon. Màu luôn đi kèm chữ. | [Mockup] + [Skill] `color-not-only` |
| **ProgressBar** | Cao 8, bo tròn, track `gray.100` (trên nền cam: overlay trắng 30%), fill theo sắc thái (`primary`, `danger` khi có quá hạn, `success` trên thẻ cam). Có `accessibilityValue`. | [Mockup] |
| **Timeline** | Nút tròn 28 viền 2px; đã trả: nền đặc + dấu tích, đường nối tô màu; chưa trả: số thứ tự. Mỗi đợt: tên + badge, số tiền `h3`, % HĐ + ngày. | [Mockup] |
| **Chip lọc** | Viên thuốc cao 40 (+hitSlop), chọn: nền `primary.500` chữ trắng semibold; thường: trắng viền `gray.200`. | [Mockup] |
| **IconCircle** | Ô bo `md`, nền pastel theo sắc thái, icon tông đậm. | [Mockup] |
| **Skeleton** | Khối `gray.200` nhấp nháy opacity 0.5↔1 (800ms); **dừng khi bật giảm chuyển động**. Giữ đúng kích thước nội dung thật. | [Skill] |
| **EmptyState / ErrorState** | Icon tròn 72 pastel, tiêu đề `h3`, mô tả, một hành động (Xóa bộ lọc / Thử lại). Lỗi có `role="alert"`. | [Skill] |
| **ScreenHeader** | Tiêu đề `h1` (role header) + phụ đề; nút quay lại 44×44 có nhãn "Quay lại". | [Skill] |
| **Thẻ tổng quan** | Gradient `primary.500 → primary.700`, bo `xl`, số tiền `display`, thanh tiến độ xanh lá, khối chia đôi Đã thanh toán / Còn lại trên overlay trắng 15%. | [Mockup] |

## 10. Hiệu ứng & chuyển động — [Skill]

- Token thời lượng `motion`: `fast` 150ms (phản hồi nhấn, hover web) · `base` 200ms · `slow` 300ms · `skeleton` 800ms.
- Phản hồi nhấn bằng màu nền/opacity, không thay đổi kích thước bố cục.
- Chỉ animate `opacity`/`transform`; tối đa 1–2 phần tử động mỗi màn hình.
- Tôn trọng giảm chuyển động: `useReducedMotion()` (native) và `@media (prefers-reduced-motion)` (web, trong `app/+html.tsx`).
- Web: `:focus-visible` hiện viền 2px `primary.500`; `cursor: pointer` cho mọi phần tử bấm (`interactive` trong `theme/motion.ts`).

## 11. Phong cách — [Mockup]

**"Thẻ sáng, gọn, tin cậy":** nền xám rất sáng, thẻ trắng bo 16 nổi nhẹ, điểm nhấn cam cho hành động và tiến độ, badge pastel cho trạng thái, số tiền in đậm định dạng `2.500.000.000 đ`.

**Đã loại bỏ từ bản sinh tự động của skill** (mâu thuẫn mockup): bảng màu teal/xanh biển, font Cinzel + Josefin Sans (thiếu chữ tiếng Việt), phong cách Glassmorphism, bố cục Hero-Centric kiểu landing page, bo góc 8px cho nút.

## 12. Anti-patterns — không được dùng

- ❌ Mã hex, `rgba()` hoặc số pixel viết trực tiếp ngoài `theme/` (dùng token) — [Skill] `color-semantic`
- ❌ Emoji làm icon; trộn nhiều bộ icon; trộn outline/filled cùng cấp — [Skill]
- ❌ Chữ cam `primary.500` trên nền trắng; chữ `gray.400` — [Skill] tương phản
- ❌ Chỉ dùng màu để biểu thị trạng thái (luôn kèm chữ/icon) — [Skill]
- ❌ Vùng chạm < 44pt; nút chỉ có icon mà không có `accessibilityLabel` — [Skill]
- ❌ Hiệu ứng nhấn scale làm xê dịch bố cục; animate width/height — [Skill]
- ❌ Placeholder thay cho nhãn; lỗi chỉ hiện ở đầu form — [Skill]
- ❌ Spinner chặn toàn màn hình khi tải danh sách (dùng Skeleton) — [Skill]
- ❌ Màn hình trống không lời giải thích; lỗi không có nút thử lại — [Skill]
- ❌ Glassmorphism, blur trang trí, gradient ngoài thẻ tổng quan/logo/panel đăng nhập — [Mockup]
- ❌ Hơn một nút primary trên một màn hình — [Skill]
- ❌ Màn hình import trực tiếp `data/mock/` — [Dự án]

## 13. Checklist trước khi giao (bắt buộc trước mỗi pull request về giao diện)

**Hình ảnh** — [Skill]
- [ ] Không emoji; mọi icon là Ionicons qua `<Icon>`, cỡ theo `sizes.icon`
- [ ] Không hex/rgba/pixel trực tiếp ngoài `theme/` (kiểm tra bằng grep, xem CLAUDE.md)
- [ ] Màu, chữ, bo góc, bóng đúng Master hoặc file `pages/` tương ứng
- [ ] Trạng thái nhấn không làm xê dịch bố cục

**Tương tác** — [Skill]
- [ ] Mọi phần tử bấm có phản hồi nhấn, `accessibilityRole`, nhãn rõ ràng, vùng chạm ≥ 44
- [ ] Nút async có `loading`; trạng thái disabled rõ ràng
- [ ] Web: có `cursor: pointer` và focus ring nhìn thấy được

**Trạng thái dữ liệu** — [Skill]
- [ ] Có đủ loading (Skeleton), rỗng (EmptyState), lỗi (ErrorState + Thử lại), và kéo-để-làm-mới nếu là danh sách

**Bố cục** — [Skill] + [Dự án]
- [ ] Kiểm tra ở 375px, 768px, 1024px, 1440px; không cuộn ngang ngoài ý muốn
- [ ] Safe area tôn trọng; nội dung không bị bottom tab che
- [ ] Desktop: nội dung ≤ 1100px căn giữa, sidebar hoạt động

**Trợ năng** — [Skill]
- [ ] Tương phản chữ ≥ 4.5:1 (trừ ngoại lệ §1.4 đã ghi nhận)
- [ ] Màu không phải tín hiệu duy nhất
- [ ] Giảm chuyển động được tôn trọng; cỡ chữ hệ thống lớn không vỡ bố cục
- [ ] Lỗi form nằm ngay dưới ô, được thông báo cho trình đọc màn hình

**Kỹ thuật** — [Dự án]
- [ ] `npx tsc --noEmit` và `npx expo lint` sạch
- [ ] `npx expo export --platform web` thành công
