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
| Chữ mờ | `semantic.textMuted` | `#4B5563` (gray-600) |
| Placeholder ô nhập | `semantic.placeholder` | `#6B7280` (gray-500) |
| Chữ cam | `semantic.textBrand` | `#AD5A0C` |
| Chữ / icon trên nền cam đặc `#F08A24` | `semantic.textOnBrand` | `#111827` (gray-900) |
| Chữ trên lớp phủ tối, ảnh, toast | `semantic.textInverse` | `#FFFFFF` |
| Chữ / icon trên nền `solid` của sắc thái | `toneColors[t].onSolid` | gray-900 (primary, warning) · trắng (success, info, danger, neutral) |
| Viền khi hover | `semantic.borderHover` | `#FACC9E` (primary-200) |
| Icon trang trí | `semantic.iconMuted` | `#9CA3AF` (không dùng cho chữ) |

**Lớp phủ** (`colors.overlay`): `heroScrim` (tối 62% phía trên ảnh) · `authFadeStart` / `authFadeMid` (nền trang 0% / 55%, mờ ảnh vào nền) · `brandTint` (primary-800, 88%) / `brandTintStrong` (primary-900, 94%) — cam đậm phủ ảnh panel/banner thương hiệu, đủ để chữ trắng ≥ 4.5:1 cả trên vùng sáng của ảnh · `scrim` (modal).

### 1.3 Màu trạng thái — badge pastel [Mockup]

Mỗi sắc thái có cặp **nền pastel + chữ đậm cùng tông** (`toneColors` trong `theme/colors.ts`):

| Sắc thái | Nền | Chữ | Đậm (thanh/chấm) | Dùng cho |
|----------|-----|-----|------------------|----------|
| `success` (xanh lá) | `#ECFDF3` | `#166534` | `#16A34A` | Đã thanh toán, đang hiệu lực, đã tất toán, phiếu thu, thanh tiến độ 100% |
| `info` (xanh dương) | `#EFF6FF` | `#1D4ED8` | `#3B82F6` | Thông tin, HĐĐC/PGC |
| `danger` (đỏ) | `#FEF2F2` | `#B91C1C` | `#EF4444` | Quá hạn, lỗi, đăng xuất |
| `warning` (vàng cam) | `#FFFBEB` | `#B45309` | `#F59E0B` | Chờ xử lý, phiếu thu chờ xác nhận |
| `primary` (cam) | `#FEF5EC` | `#AD5A0C` | `#F08A24` | Đến hạn, thanh toán một phần |
| `neutral` (xám) | `#F3F4F6` | `#374151` | `#6B7280` | Chưa đến hạn, phiếu thu đã hủy |

### 1.4 Tương phản — [Skill] áp lên màu [Mockup] (đã kiểm định tự động)

Đo theo WCAG (`color-contrast`, `color-accessible-pairs`) bằng script kiểm định (§13) trên mọi màn ở 375/768/1024/1440px — **mọi chữ ≥ 4.5:1** (chữ lớn ≥ 3:1):

| Cặp | Tỷ lệ | Quy tắc |
|-----|-------|---------|
| Chữ `primary.700` trên trắng / trên `primary.50` | 4.95 / 4.59:1 | Mọi chữ màu cam (link, số tiền, tab chọn) |
| Chữ `gray.600` (`textMuted`) trên trắng / nền pastel | 7.6 / ≥ 7:1 | Chữ phụ, ngày, chú thích |
| Placeholder `gray.500` trên trắng | 4.83:1 | Chỉ cho placeholder (ô nhập nền trắng) |
| Chữ `gray.400` | 2.54:1 | ❌ Không dùng cho chữ — chỉ icon trang trí |
| Chữ badge pastel (6 sắc thái) | 4.6 – 9.4:1 | ✅ |
| **Chữ `gray.900` trên nền cam `#F08A24`** | **7.07:1** | Nút primary, chip đang chọn, dấu tick checkbox — **giữ nguyên màu nền cam của mockup** |
| ~~Chữ trắng trên `#F08A24`~~ | 2.51:1 | ❌ Đã bỏ (trước đây là ngoại lệ chờ duyệt; yêu cầu kiểm định 4.5:1 đã quyết định) |
| Chữ trắng trên lớp phủ `brandTint` / `brandTintStrong` / `heroScrim` | ≥ 4.5:1 (kể cả vùng sáng của ảnh) | Banner, panel đăng nhập, hero mobile |
| Avatar: chữ `primary.800` trên `primary.100` | 5.9:1 | |
| Nút danger: chữ `danger.700` trên trắng / `danger.50` | 6.5 / 6:1 | |

**Miễn trừ:** logo/wordmark "BeeSky" (WCAG 1.4.3 không áp dụng cho logotype); phần tử `disabled`.

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
| `radius.xs` | 4 | Ô checkbox |
| `radius.sm` | 8 | Skeleton dòng chữ |
| `radius.md` | 12 | Nút, ô nhập, ô icon, mục sidebar |
| `radius.lg` | 16 | **Thẻ trắng** (Card), thông báo |
| `radius.xl` | 24 | Banner thương hiệu, hộp thoại |
| `radius.full` | 9999 | Badge, chip, thanh tiến độ, avatar, nút tròn timeline |

## 5. Đổ bóng — [Mockup] (thang nhất quán theo [Skill] `elevation-consistent`)

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `shadows.sm` | `0 1px 2px rgba(16,24,40,.05), 0 1px 3px rgba(16,24,40,.06)` | Thẻ mặc định |
| `shadows.md` | `0 4px 12px rgba(16,24,40,.08)` | Thẻ form/phiếu thu |
| `shadows.lg` | `0 12px 32px rgba(16,24,40,.12)` | Modal (dự phòng) |
| `shadows.navTop` | `0 -2px 12px rgba(16,24,40,.04)` | Bottom tab |
| `shadows.focusHalo` | vòng 3px `primary.100` | Ô nhập khi focus |

Thẻ = nền trắng + viền `borderSubtle` 1px + `shadows.sm`. Không dùng glassmorphism/blur trang trí.

---

## 6. Kích thước & vùng chạm — [Skill]

| Token | Giá trị | Quy tắc |
|-------|---------|---------|
| `sizes.touchTarget` | 44 | **Hộp bấm thật** (DOM/native) của mọi phần tử tương tác ≥ 44 ở cả hai chiều: link chữ (`TextLink`, link Section, Breadcrumb) có `minHeight` 44; nút icon 44×44; nút hiện/ẩn mật khẩu 44×44 |
| `sizes.control` | sm 44 · md 48 · lg 56 | Chiều cao nút/chip/ô nhập — **không dùng hitSlop để bù** (web không có hitSlop) |
| `sizes.icon` | xs 12 · sm 16 · md 20 · lg 24 · xl 32 | Không dùng cỡ icon tùy ý |
| `sizes.iconBox` | sm 36 · md 40 · lg 44 · xl 48 · hero 72 | Ô icon pastel (`IconCircle`) |
| `sizes.avatar` | sm 36 · md 44 · lg 64 | Avatar chữ cái đầu |
| `sizes.checkbox` | 22 | Ô checkbox (vùng chạm vẫn ≥ 44 nhờ cả hàng nhãn) |
| `sizes.authHero.mobile` | 260 | Chiều cao ảnh hero màn xác thực trên mobile |
| `sizes.banner` | mobile 168 · wide 208 | Chiều cao tối thiểu banner thương hiệu |
| `sizes.actionTile.minHeight` | 96 | Ô chức năng |
| `sizes.projectImage` | 148 | Chiều cao ảnh dự án trên thẻ hợp đồng |
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

Breakpoint (`useBreakpoint`): mobile < 768 ≤ tablet < 1024 ≤ desktop < 1280 ≤ wide. Màn hình nhiều khối dùng lưới 12 cột `Grid`/`Col` (ví dụ Trang chủ: 7 + 5 ở desktop) thay vì kéo giãn bố cục mobile.

[Skill]: bottom nav ≤ 5 mục, có nhãn; mục hiện tại được tô (nền `primary.50` + icon filled + chữ `textBrand`); đăng xuất tách khỏi mục điều hướng; nội dung không bị che bởi thanh cố định (safe area); không cuộn ngang trên mobile (chip lọc cuộn ngang trong vùng riêng là ngoại lệ có chủ đích).

---

## 9. Thông số component

| Component | Thông số | Nguồn |
|-----------|----------|-------|
| **Button** | `primary` nền `primary.500`, hover/nhấn `primary.600`, **chữ `gray.900`** semibold · `secondary` nền `primary.50` → hover `primary.100`, chữ `primary.700`, viền `primary.100` · `outline` trắng viền `gray.200` → hover `gray.50` · `ghost` trong suốt → hover `gray.100`, chữ `gray.700` · `danger` nền trắng → hover `danger.50`, chữ `danger.700`, viền `danger.100`. Cao 44/48/56, bo `md`, có `loading` (spinner + `aria-busy`) và `disabled` (opacity 0.5). Nhãn được xuống dòng, không cắt. Mỗi màn hình tối đa 1 nút primary. | [Mockup] màu · [Skill] trạng thái, tương phản |
| **Input** | Nhãn hiển thị phía trên (không chỉ placeholder), cao 48, viền 1.5px `gray.200` → focus `primary.500` + halo, lỗi `danger.500` + dòng lỗi kèm icon ngay dưới ô (`aria-describedby`, `role="alert"`); nút hiện/ẩn mật khẩu có nhãn. | [Skill] |
| **Card** | Trắng, bo `lg`, viền `borderSubtle`, `shadows.sm`, padding `md` (`none` khi có ảnh tràn viền). Bấm được → phản hồi opacity 0.85, **không scale**. `hoverLift` (web): hover dịch lên 2px + `shadows.md` (transform, không đổi bố cục) — dùng cho thẻ danh sách. | [Mockup] + [Skill] |
| **Badge** | Viên thuốc pastel (§1.3), chữ caption semibold, tùy chọn chấm màu/icon. Màu luôn đi kèm chữ. Luôn một dòng, không co (`flexShrink: 0`) — phần tử bên cạnh co/xuống dòng thay. | [Mockup] + [Skill] `color-not-only`, compact label overflow |
| **ProgressBar** | Cao 8, bo tròn, track `gray.100`, fill theo sắc thái: `primary` (cam) khi đang trả, `success` (xanh lá) khi 100%. Có `accessibilityValue` + nhãn có chữ. | [Mockup] |
| **Timeline** | Nút tròn 28 viền 2px, **luôn có icon theo trạng thái**: đã trả = xanh lá đặc + dấu tick (đường nối tô xanh) · đến hạn = cam đặc + đồng hồ báo thức · chưa đến hạn = viền xám + đồng hồ · quá hạn = đỏ + cảnh báo. Mỗi đợt: tên + Badge (chữ + icon), số tiền `h3`, % HĐ + ngày; tên truy cập đầy đủ mỗi dòng. | [Mockup] + [Skill] |
| **Chip lọc / tab lọc** | Viên thuốc cao 44 (`sizes.control.sm`), chọn: nền `primary.500` chữ `textOnBrand` (gray-900) semibold, hover `primary.600`; thường: trắng viền `gray.200`, hover viền cam + nền `primary.50`; tùy chọn số lượng "(n)". Dùng `role="tab"` trong vùng `role="tablist"` với style `chipRow` (**xuống dòng**, không cuộn ngang). | [Mockup] + [Skill] chip collection reflow |
| **IconCircle** | Ô bo `md`, nền pastel theo sắc thái, icon tông đậm. | [Mockup] |
| **Skeleton** | Khối `gray.200` nhấp nháy opacity 0.5↔1 (800ms); **dừng khi bật giảm chuyển động**. Giữ đúng kích thước nội dung thật. | [Skill] |
| **EmptyState / ErrorState** | Icon tròn 72 pastel, tiêu đề `h3`, mô tả, một hành động (Xóa bộ lọc / Thử lại). Lỗi có `role="alert"`. | [Skill] |
| **ScreenHeader** | Tiêu đề `h1` (role header) + phụ đề; nút quay lại 44×44 có nhãn "Quay lại". | [Skill] |
| **Button `outline`** | Nền trắng, viền `gray.200`, chữ `gray.900`, nhấn `gray.50`. Dùng cho đăng nhập bên thứ ba (Google/Apple). | [Skill] `primary-action` |
| **Checkbox** | Ô 22 bo `xs`, viền 2px `gray.400` (hover viền cam) → chọn: nền `primary.500` + dấu tích `textOnBrand`; cả hàng nhãn là vùng chạm ≥ 44; `role="checkbox"` + `checked`; lỗi hiển thị ngay dưới. | [Skill] |
| **TextLink** | Chữ `smallMedium` semibold `textBrand`, `role="link"`, cao tối thiểu 44 (`sizes.touchTarget`), hover gạch chân. | [Skill] tương phản + vùng chạm |
| **Divider** | Đường kẻ 1px `border`, tùy chọn chữ `caption` ở giữa ("hoặc tiếp tục với"). | [Mockup] |
| **FormErrorSummary** | Hộp `danger` pastel đầu form, tiêu đề "Vui lòng kiểm tra lại thông tin" + danh sách lỗi dạng link tới ô; nhận focus sau khi gửi thất bại với **≥ 2 lỗi** (1 lỗi → focus thẳng vào ô); lỗi chi tiết vẫn hiện dưới từng ô. | [Skill] `error-summary`, `focus-management` |
| **Toast** | `ToastProvider` ở root + `useToast().show(msg, tone)`. Nền `gray.900`, chữ trắng, icon theo tông, tối đa `sizes.toastMaxWidth`, dưới cùng màn hình (trên safe area), tự ẩn sau `motion.toast` (3.5s), `role="status"`, không lấy focus. | [Skill] `toast-dismiss`, `toast-accessibility` |
| **FadeIn** | Bọc nội dung để mờ dần + trượt lên (`motion.enter`, trễ `motion.stagger` × index), `ReduceMotion.System`. Chỉ dùng ở màn xác thực. | [Skill] |
| **ActionTile** | Ô chức năng: `IconCircle` pastel + nhãn semibold, nền trắng, viền `borderSubtle`, bo `lg`, cao tối thiểu `sizes.actionTile.minHeight`. Web hover: nền + viền theo tông pastel; nhấn: opacity 0.85; `compact` cho màn hẹp. | [Mockup] + [Skill] hover |
| **IconButton** | Nút 44×44 chỉ có icon, viền mảnh; hover/nhấn nền `gray.100`. Tùy chọn **chấm đỏ** (`dot`) + `dotLabel` ghép vào tên truy cập (màu không là tín hiệu duy nhất). | [Skill] |
| **BrandBanner** | Ảnh khu đô thị + gradient cam ngang, bo `xl`, logo inverted, chữ trắng. Trang trí. | [Mockup] |
| **Grid / Col** | Lưới 12 cột (`layout.gridColumns`), `Col span={{ mobile, tablet?, desktop?, wide? }}` (breakpoint lớn kế thừa nhỏ hơn), gutter theo token spacing. | [Dự án] |
| **ProjectImage** | Ảnh dự án `cover`, chiều cao cố định (`sizes.projectImage`), có nhãn truy cập; thiếu URL/lỗi → ảnh minh họa mặc định. | [Mockup] |
| **Tabs / TabPanel** | Tab gạch chân: tab chọn có viền dưới 3px `brand` + chữ `textBrand` đậm; cao ≥ 44. `role="tablist"`/`"tab"` + `aria-selected`, panel `role="tabpanel"` + `aria-labelledby` + `tabIndex=0`. Web: roving tabindex, ←/→ (vòng), Home/End. | [Skill] keyboard-nav |
| **Dialog** | Modal giữa màn hình, nền `scrim`, hộp trắng bo `xl`, tối đa 440px, `shadows.lg`; tiêu đề `h3` làm nhãn dialog, nút X (IconButton); hàng nút cuối (Hủy ghost + hành động primary). Đóng bằng Esc / X / vùng tối / Back; web giữ focus trong hộp thoại, focus đầu vào nút Đóng, đóng xong trả focus về nút mở. Tắt hiệu ứng khi giảm chuyển động. | [Skill] modal-escape, focus |
| **Breadcrumb** | Desktop: "Mục cha › Mục hiện tại", link `textBrand`, mục hiện tại `textMuted` + `aria-current="page"`, `role="navigation"`. | [Skill] breadcrumb-web |
| **StickyActionBar** | Thanh trắng dính đáy (mobile/tablet), viền trên + `shadows.navTop`, chứa 1 nút primary full width; đặt ngoài ScrollView (prop `footer` của `Screen`) để không che nội dung; tự chừa vùng an toàn khi không có bottom tab. | [Skill] sticky-navigation, safe-area |
| **DataTable** | Bảng cho màn ≥ 1024px: khung trắng bo `lg` viền `borderSubtle`; hàng tiêu đề nền `surfaceMuted`, chữ `overline` `textMuted`; dòng cao ≥ 56, phân cách 1px; cột số căn phải `tabular-nums`. Semantics `table` / `row` / `columnheader` / `cell`. Dòng bấm được: hover `primary.50` + pointer, focus Tab, Enter mở. Màn hẹp dùng danh sách thẻ thay bảng. | [Skill] table handling |
| **AuthLayout** | Khung Đăng nhập / Đăng ký / Quên mật khẩu — xem `pages/login.md`. | [Mockup] |

## 10. Hiệu ứng & chuyển động — [Skill]

- Token thời lượng `motion`: `fast` 150ms (phản hồi nhấn, hover web, toast ẩn) · `base` 200ms (toast hiện) · `slow` 300ms · `enter` 320ms + `stagger` 60ms (xuất hiện màn xác thực) · `skeleton` 800ms · `toast` 3500ms (thời gian hiển thị).
- Lớp hiển thị `zIndex`: `base` 0 · `overlay` 40 · `toast` 100.
- Phản hồi nhấn bằng màu nền/opacity, không thay đổi kích thước bố cục.
- Chỉ animate `opacity`/`transform`; tối đa 1–2 phần tử động mỗi màn hình.
- Tôn trọng giảm chuyển động: `useReducedMotion()` (native) và `@media (prefers-reduced-motion)` (web, trong `app/+html.tsx`).
- Web: `:focus-visible` hiện viền 2px `primary.500`; `cursor: pointer` cho mọi phần tử bấm (`interactive` trong `theme/motion.ts`).
- **Mọi phần tử tương tác có trạng thái hover nhìn thấy được** (web) qua `useHover()` (`hooks/useHover.ts`): nút đổi nền; chip viền cam + nền `primary.50`; link chữ gạch chân; thẻ bấm được viền `borderHover` (thẻ danh sách thêm `hoverLift`); mục menu/sidebar/tab nền nhạt; mục đang chọn đậm thêm (`primary.100`). Hover không làm đổi kích thước.
- **Bàn phím (web)**: thứ tự Tab theo thứ tự hiển thị; liên kết **"Bỏ qua tới nội dung chính"** là phần tử focus đầu tiên (ẩn cho tới khi focus, chuyển focus tới vùng `role="main"` của `Screen`); tab nội dung dùng ←/→/Home/End; hộp thoại giữ focus, Esc đóng.
- **Giảm chuyển động**: Skeleton dừng nhấp nháy, `FadeIn`/Toast/Dialog không hiệu ứng, chuyển màn Stack `animation: 'none'` (native), CSS transition/animation ~0ms (web).

## 11. Phong cách — [Mockup]

**"Thẻ sáng, gọn, tin cậy":** nền xám rất sáng, thẻ trắng bo 16 nổi nhẹ, điểm nhấn cam cho hành động và tiến độ, badge pastel cho trạng thái, số tiền in đậm định dạng `2.500.000.000 đ`.

**Đã loại bỏ từ bản sinh tự động của skill** (mâu thuẫn mockup): bảng màu teal/xanh biển, font Cinzel + Josefin Sans (thiếu chữ tiếng Việt), phong cách Glassmorphism, bố cục Hero-Centric kiểu landing page, bo góc 8px cho nút.

## 12. Anti-patterns — không được dùng

- ❌ Mã hex, `rgba()` hoặc số pixel viết trực tiếp ngoài `theme/` (dùng token) — [Skill] `color-semantic`
- ❌ Emoji làm icon; trộn nhiều bộ icon; trộn outline/filled cùng cấp — [Skill]
- ❌ Chữ cam `primary.500` trên nền trắng; chữ `gray.400`; **chữ trắng trên nền cam `#F08A24`** (dùng `textOnBrand`) — [Skill] tương phản
- ❌ `numberOfLines` / `adjustsFontSizeToFit` cắt hoặc thu nhỏ chữ thiết yếu (tên đợt, mã HĐ, số tiền) — cho xuống dòng — [Skill] text reflow
- ❌ Dùng `hitSlop` để "bù" vùng chạm < 44 (không có tác dụng trên web) — [Skill]
- ❌ `accessibilityState={{ selected / checked / disabled }}` — react-native-web không xuất ra DOM; dùng `aria-selected`, `aria-checked`, `aria-disabled`, `aria-busy` (chạy được cả native) — [Skill] + [Dự án]
- ❌ Phần tử bấm được không có hover trên web; hành động nguy hiểm (đăng xuất) không có xác nhận — [Skill]
- ❌ Chỉ dùng màu để biểu thị trạng thái (luôn kèm chữ/icon) — [Skill]
- ❌ Vùng chạm < 44pt; nút chỉ có icon mà không có `accessibilityLabel` — [Skill]
- ❌ Hiệu ứng nhấn scale làm xê dịch bố cục; animate width/height — [Skill]
- ❌ Placeholder thay cho nhãn; lỗi chỉ hiện ở đầu form — [Skill]
- ❌ Spinner chặn toàn màn hình khi tải danh sách (dùng Skeleton) — [Skill]
- ❌ Màn hình trống không lời giải thích; lỗi không có nút thử lại — [Skill]
- ❌ Glassmorphism, blur trang trí, gradient ngoài logo / ảnh nền màn xác thực / banner thương hiệu — [Mockup]
- ❌ Modal không đóng được bằng Esc/Back, không giữ focus, hoặc không trả focus về nút mở — [Skill]
- ❌ Thanh/nút cố định che nội dung hoặc phần tử đang focus — [Skill]
- ❌ Bảng dữ liệu trên màn hẹp (tràn / cuộn ngang) — dùng thẻ — [Skill]
- ❌ Hàng chip/tab lọc cuộn ngang hoặc bị cắt; cắt chữ mã hợp đồng / tên dự án (cho xuống dòng) — [Skill]
- ❌ Hiển thị số chưa đọc chỉ bằng màu/số trần cho trình đọc màn hình (dùng cụm từ đầy đủ) — [Skill]
- ❌ Hơn một nút primary trên một màn hình — [Skill]
- ❌ Màn hình import trực tiếp `data/mock/` — [Dự án]

## 13. Checklist trước khi giao (bắt buộc trước mỗi pull request về giao diện)

**Kiểm định tự động** — chạy `npm run audit:ui` (`scripts/ui-audit.js`, README › Kiểm định) khi dev server web đang chạy. Script duyệt mọi màn ở 375 / 768 / 1024 / 1440px và báo: vùng chạm < 44, tương phản chữ < 4.5:1 (lấy mẫu gradient tại vị trí chữ, ảnh tính cả vùng tối và sáng), chữ bị cắt, cuộn ngang, thiếu focus ring, thiếu `cursor: pointer`, thiếu hover, tab/checkbox thiếu `aria-selected`/`aria-checked`, lỗi/cảnh báo console. **Kết quả phải rỗng** (trừ mục đã ghi rõ là sai lệch của công cụ).

**Hình ảnh** — [Skill]
- [ ] Không emoji; mọi icon là Ionicons qua `<Icon>`, cỡ theo `sizes.icon`
- [ ] Không hex/rgba/pixel trực tiếp ngoài `theme/` (grep trong CLAUDE.md)
- [ ] Màu, chữ, bo góc, bóng đúng Master hoặc file `pages/` tương ứng
- [ ] Trạng thái hover/nhấn không làm xê dịch bố cục

**Tương tác** — [Skill]
- [ ] Mọi phần tử bấm có `accessibilityRole`, nhãn rõ ràng, hộp bấm ≥ 44×44, hover + nhấn + focus nhìn thấy được
- [ ] Nút async có `loading`; trạng thái disabled rõ ràng; hành động nguy hiểm có xác nhận
- [ ] Web: điều hướng hoàn toàn bằng bàn phím (Tab, Enter/Space, Esc, phím mũi tên trong tab), có skip link

**Trạng thái dữ liệu** — [Skill]
- [ ] Mọi danh sách có loading (Skeleton), rỗng (EmptyState + hành động), lỗi (ErrorState + Thử lại), kéo-để-làm-mới

**Bố cục** — [Skill] + [Dự án]
- [ ] 375 / 768 / 1024 / 1440px: không cuộn ngang, không chữ/badge bị cắt
- [ ] Safe area tôn trọng; nội dung không bị bottom tab / thanh dính che
- [ ] Desktop: nội dung ≤ 1100px căn giữa, sidebar hoạt động

**Trợ năng** — [Skill]
- [ ] Tương phản chữ ≥ 4.5:1 (chữ lớn ≥ 3:1) — không còn ngoại lệ (§1.4)
- [ ] Màu không phải tín hiệu duy nhất
- [ ] Giảm chuyển động được tôn trọng (§10); cỡ chữ hệ thống lớn không vỡ bố cục
- [ ] Lỗi form nằm ngay dưới ô, được thông báo cho trình đọc màn hình

**Kỹ thuật** — [Dự án]
- [ ] `npx tsc --noEmit` và `npx expo lint` sạch
- [ ] `npx expo export --platform web` thành công; `npx expo-doctor` không có lỗi mới
