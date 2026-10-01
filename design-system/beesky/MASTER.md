# BeeSky – Design System Master

> **QUY TẮC ĐỌC:** Khi làm một màn hình, đọc file này trước, sau đó đọc `design-system/beesky/pages/<màn>.md`.
> Nếu file của màn hình tồn tại, quy tắc trong đó **ghi đè** file Master này. Nếu không có, tuân thủ Master.

**Dự án:** BeeSky – ứng dụng khách hàng bất động sản (hợp đồng, lịch thanh toán, phiếu thu)
**Nền tảng:** Expo SDK 57 + React Native + react-native-web (iOS, Android, Web), NativeWind v4
**Cập nhật:** 2026-10-01 · **bản làm mới "Bo tròn – Mật ong & Cà phê"** (tham khảo phong cách app nội bộ Beeland Sales: chỉ một font, thẻ bo 24–28, bóng nhẹ thay viền, chip chọn nền tối, thẻ tổng tiền nền đậm, tab kính nổi — nhưng **giữ bản sắc BeeSky**: cam #F08A24, thang xám ấm, màu đậm nâu cà phê thay cho navy)

### Nguồn của từng quyết định

| Nhãn | Ý nghĩa |
|------|---------|
| **[Mockup]** | Bản sắc BeeSky (cam thương hiệu, nền sáng, badge pastel, thanh tiến độ, timeline). Khi skill mâu thuẫn, mockup thắng. |
| **[Làm mới]** | Phong cách của bản làm mới 2026-10 (hình khối, font, icon, màu đậm) — tham khảo app Beeland Sales, **không sao chép** màu. |
| **[Skill]** | Lấy từ skill `ui-ux-pro-max` (chỉ những phần không mâu thuẫn mockup). |
| **[Dự án]** | Quyết định kỹ thuật/kiến trúc của dự án (yêu cầu ban đầu hoặc ràng buộc nền tảng). |

**Mã nguồn token:** mọi giá trị dưới đây nằm trong `theme/tokens.json` — bảng màu, **vai trò màu (`semantic`) và cặp sắc thái (`tone`) khai báo dạng tham chiếu** `"gray.900"`, được `theme/colors.ts` và test tương phản cùng đọc. Component **không** được viết mã hex hay số pixel trực tiếp.

---

## 1. Màu sắc — [Mockup] + [Làm mới]

### 1.1 Ba nhóm màu

| Nhóm | Vai trò | Ghi chú |
|------|---------|---------|
| **Cam BeeSky** `primary` | Thương hiệu (500 `#F08A24`) + **cam mật ong đậm** cho nút chính (700 `#A9520A`) | Cam sáng chỉ để trang trí; mọi chữ/nền chữ dùng 700 trở lên |
| **Cát** `gray` | Thang trung tính **ấm** (hơi ngả nâu, tông 22–32°) | Khác thang slate xanh xám của app tham khảo |
| **Cà phê** `ink` | Màu đậm: thẻ tổng tiền, chip/tab đang chọn, toast | Nâu đen `#2B2019` — "ong đen + mật cam", thay cho navy |

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `primary.50` / `100` / `200` | `#FEF5EC` / `#FDE7D0` / `#FACC9E` | Nền pastel (badge, nút phụ, thông báo chưa đọc) / hover / viền hover |
| **`primary.500`** | **`#F08A24`** | **Thương hiệu**: logo, thanh tiến độ, chấm chưa đọc, gradient — không đặt chữ trắng lên |
| `primary.600` | `#D2700F` | Logo (cuối gradient) |
| **`primary.700`** | **`#A9520A`** | **Nút chính** (`action`), chữ cam (`textBrand`), viền focus |
| `primary.800` / `900` | `#8A420A` / `#6E3709` | Nút chính khi hover / nhấn |
| `gray.50 … 900` | `#FAF8F6` `#F3EFEB` `#E8E2DB` `#D5CDC4` `#A89D92` `#73685F` `#605750` `#473F39` `#2F2925` `#1F1A17` | Nền, viền, chữ |
| `ink.600 … 900` | `#4A3A2F` `#3D2E24` `#2B2019` `#1E1611` | Nền đậm (800 mặc định, 700 hover, 900 toast) |
| `onInk` | chữ `#FFFFFF` · phụ `#D8CCC1` · nhấn **mật ong `#FFB866`** · track/divider trắng 16% / 12% | Nội dung trên nền ink |
| `background` | `#F6F3EF` | Nền màn hình (cát rất sáng) |

### 1.2 Màu theo vai trò (`tokens.json` → `semantic`)

| Vai trò | Token | Tham chiếu |
|---------|-------|-----------|
| Nền trang / thẻ / phụ / lõm | `bg` / `surface` / `surfaceMuted` / `surfaceSunken` | `background` / trắng / `gray.50` / `gray.100` |
| Viền / viền đậm / viền hover | `border` / `borderStrong` / `borderHover` | `gray.200` / `gray.300` / `primary.200` |
| Chữ chính / phụ / mờ / placeholder | `text` / `textSecondary` / `textMuted` / `placeholder` | `gray.900` / `700` / `600` / `500` |
| Chữ cam, chữ thành công | `textBrand` / `textSuccess` | `primary.700` / `success.700` |
| **Nút chính** | `action` → `actionHover` → `actionPressed`, chữ `textOnAction` | `primary.700` → `800` → `900`, trắng |
| Nền cam sáng (hiếm) | `brand`, chữ `textOnBrand` | `primary.500`, `gray.900` |
| **Nền đậm** | `inverse` / `inverseHover` / `inverseStrong` | `ink.800` / `700` / `900` |
| Chữ trên nền đậm | `onInverse` / `onInverseMuted` / `onInverseAccent` | trắng / `onInk.muted` / mật ong |
| Thanh tiến độ & đường kẻ trên nền đậm | `inverseTrack` / `inverseDivider` | trắng 16% / 12% |
| Thanh tab kính | `glass` / `glassBorder` | trắng ấm 86% / trắng 70% |
| Focus | `focusRing` / `focusHalo` | `primary.700` / `primary.100` |
| Icon | `icon` / `iconMuted` | `gray.700` / `gray.400` (chỉ trang trí, không dùng cho chữ) |

**Lớp phủ** (`colors.overlay`): `heroScrim` (ink 62% phía trên ảnh hero mobile) · `authFadeStart` / `authFadeMid` (nền trang 0% / 55%) · `brandTint` (cam đậm 88%) → `brandTintStrong` (ink 92%) — gradient panel đăng nhập & banner · `scrim` (ink 50%, sau hộp thoại).

### 1.3 Màu trạng thái — badge pastel [Mockup]

Mỗi sắc thái có cặp **nền pastel + chữ đậm cùng tông** (`tokens.json` → `tone`, `toneColors` trong code):

| Sắc thái | Nền | Chữ | Đậm (thanh/chấm) | Dùng cho |
|----------|-----|-----|------------------|----------|
| `success` | `#ECFDF3` | `#166534` | `#16A34A` | Đã thanh toán, đang hiệu lực, thanh tiến độ 100% |
| `info` | `#EFF6FF` | `#1D4ED8` | `#3B82F6` | Thông tin |
| `danger` | `#FEF2F2` | `#B91C1C` | `#EF4444` | Quá hạn, lỗi, đăng xuất |
| `warning` | `#FFFBEB` | `#B45309` | `#F59E0B` | Chờ xác nhận |
| `primary` | `#FEF5EC` | `#A9520A` | `#F08A24` | Đến hạn, thanh toán một phần |
| `neutral` | `#F3EFEB` | `#473F39` | `#73685F` | Chưa đến hạn, đã hủy |

### 1.4 Tương phản — kiểm bằng **test tự động** (`npm test`) + kiểm định giao diện (§13)

`tests/contrast.test.cjs` đọc `tokens.json` và kiểm **72 cặp** (chữ ≥ 4.5:1, icon / viền focus / thanh tiến độ ≥ 3:1, kính tính trên nền trắng và nền tối nhất, lớp phủ tính trên vùng sáng nhất của ảnh). Đổi token làm hỏng cặp nào → test đỏ.

| Cặp | Tỷ lệ |
|-----|-------|
| Chữ trắng trên **nút chính** `#A9520A` / hover / nhấn | **5.39** / 7.33 / 9.49:1 |
| `textBrand` trên trắng / trên `bg` / trên `primary.50` | 5.39 / 4.87 / 5.00:1 |
| `text` / `textSecondary` / `textMuted` trên trắng | 17.2 / 10.3 / 7.06:1 (`textMuted` trên `bg`: 6.38) |
| `placeholder` trên trắng / trên ô nhập `surfaceSunken` | 5.42 / 4.74:1 |
| Trên ink `#2B2019`: trắng / chữ phụ / mật ong / thanh cam | 15.9 / 10.1 / 9.29 / 6.32:1 |
| `textOnBrand` (gray-900) trên cam sáng `#F08A24` | 6.87:1 |
| Badge pastel (6 sắc thái) | 4.84 – 9.01:1 |
| ~~Chữ trắng trên `#F08A24`~~ | 2.51:1 ❌ không dùng |

**Miễn trừ:** logo/wordmark "BeeSky" (WCAG 1.4.3 không áp dụng cho logotype); phần tử `disabled`.

---

## 2. Typography — [Làm mới] + [Skill]

**Một họ font duy nhất: Be Vietnam Pro** (thiết kế cho tiếng Việt, đủ dấu) — 400 / 500 / 600 / 700, nạp bằng `expo-font` từ `@expo-google-fonts/be-vietnam-pro` (`theme/fonts.ts`). Mỗi độ đậm là một `fontFamily` (`fontFamily.regular|medium|semibold|bold`), chỉ `<Text>` và `<Input>` đặt font.

**Thang chữ** (`textVariants` trong `theme/typography.ts`, luôn dùng `<Text variant>`):

| Variant | Cỡ / dòng · độ đậm | Dùng cho |
|---------|---------------------|----------|
| `display` | 28 / 36 · 700, giãn −0.2 | Số tiền lớn (thẻ tổng tiền, phiếu thu) |
| `title` | 22 / 28 · 700, giãn −0.2 | Tiêu đề màn, tên người dùng |
| `heading` | 17 / 24 · 600 | Tiêu đề khối, mã hợp đồng, tiêu đề hộp thoại |
| `subhead` | 15 / 22 · 600 | Dòng nhấn mạnh, số tiền vừa, nhãn nút |
| `body` / `bodyStrong` | 15 / 22 · 400 / 500 | Nội dung |
| `caption` / `captionStrong` | 14 / 20 · 400 / 500 | Thông tin phụ, ngày, giá trị dòng, nút nhỏ, chip |
| `label` | 12 / 16 · 600, giãn 0.4 | **Cỡ nhỏ nhất**: badge, tiêu đề cột bảng, nhãn nhóm, nhãn tab |

- **Số tiền, ngày, mã**: prop `numeric` của `<Text>` → chữ số đều độ rộng (`tabular-nums`) để cột số thẳng hàng.
- Ô nhập 15px; line-height ~1.3–1.45; **không tắt** `allowFontScaling`. Nhãn tab nổi / ô chức năng hẹp bỏ giãn chữ để vừa một dòng.

---

## 3. Khoảng cách — lưới 4pt [Skill]

| Token | px | Dùng cho |
|-------|----|----------|
| `xs` | 4 | Icon ↔ chữ nhỏ, tiêu đề ↔ phụ đề |
| `sm` | 8 | Icon ↔ chữ, giữa các chip |
| `ms` | 12 | Trong thẻ, giữa các thẻ danh sách |
| `md` | 16 | Padding thẻ, lề mobile |
| `ml` | 20 | Padding thẻ lớn, khoảng cách khối |
| `lg` | 24 | Padding thẻ tổng tiền / hộp thoại |
| `xl` | 32 | Lề desktop |
| `2xl` | 48 · `3xl` 64 | Panel thương hiệu, trạng thái rỗng |

Mọi giá trị là bội số của 4 (đã bỏ `2xs` = 2).

---

## 4. Bo góc — [Làm mới]

| Token | px | Dùng cho |
|-------|----|----------|
| `xs` 4 · `sm` 8 | | Skeleton dòng chữ, checkbox |
| `md` | 12 | Ô nhỏ |
| `lg` | 16 | Nút, ô nhập, khối lồng trong thẻ, mục sidebar, toast-row |
| `xl` | 20 | Khối số tiền trong hộp thoại, thẻ người dùng sidebar, thẻ cảnh báo nhỏ |
| **`2xl`** | **24** | **Thẻ ở màn chính** (Card mặc định), bảng, ô chức năng, thông báo |
| **`3xl`** | **28** | **Thẻ tổng tiền**, banner, hộp thoại, thẻ form xác thực, đỉnh StickyActionBar |
| `full` | 9999 | Chip, badge, tab phân đoạn, nút tròn, avatar, thanh tiến độ, thanh tab nổi |

## 5. Đổ bóng — 4 mức [Làm mới]

Bóng nâu ấm (`rgba(43, 32, 25, α)`), **thẻ dùng bóng thay cho viền**:

| Token | Dùng cho |
|-------|----------|
| `shadows.soft` | Thẻ, chip thường, nút tròn, ô chức năng, bảng |
| `shadows.raised` | Hover của thẻ bấm được, thẻ tổng tiền, thẻ form; `raisedTop` cho StickyActionBar |
| `shadows.overlay` | Toast, thanh tab nổi |
| `shadows.modal` | Hộp thoại |
| `shadows.focusHalo` | Vòng 3px `primary.100` quanh ô nhập khi focus |

Thẻ cần ảnh tràn góc: **cắt ảnh ở lớp riêng** (`imageWrap` bo góc trên) thay vì `overflow: hidden` cả thẻ (iOS mất bóng). Thanh tab kính tách 2 lớp (ngoài giữ bóng, trong cắt bo).

---

## 6. Kích thước & vùng chạm — [Skill]

| Token | Giá trị | Quy tắc |
|-------|---------|---------|
| `sizes.touchTarget` | 44 | Hộp bấm thật của mọi phần tử tương tác ≥ 44×44 |
| `sizes.control` | sm 44 · md 48 · lg 52 | Nút / chip / ô nhập — **không dùng hitSlop để bù** |
| `sizes.icon` | xs 12 · sm 16 · md 20 · lg 24 · xl 32 | |
| `sizes.iconBox` | sm 36 · md 40 · lg 44 · xl 48 · hero 72 | Ô icon tròn (`IconCircle`) |
| `sizes.avatar` | sm 36 · md 44 · lg 64 | |
| `sizes.checkbox` | 24 | |
| `sizes.tabBar` | cao 64 · rộng tối đa 440 · blur 40 | Thanh tab kính nổi (mobile) |
| `sizes.moneyCard.statMinWidth` | 120 | Cột số liệu trong thẻ tổng tiền (xuống dòng khi hẹp) |
| `sizes.projectImage` | 148 | Ảnh dự án trên thẻ |
| `layout.contentMaxWidth` / `sidebarWidth` | 1100 / 248 | [Dự án] |

## 7. Icon — [Làm mới]

- **Một bộ duy nhất: lucide-react-native** (nét 2px bo tròn, SVG qua `react-native-svg`). Gọi bằng **tên ngữ nghĩa** `<Icon name="document" />` — bảng tên ↔ icon ở `theme/icons.ts` (đổi bộ icon chỉ sửa file này).
- Trạng thái đang chọn: màu + nét đậm hơn (`strong`, 2.4) — lucide không có bản filled.
- Logo Google / Apple: `<BrandMark>` (đường vẽ Simple Icons, CC0) — lucide không có logo thương hiệu.
- **Không dùng emoji**. Icon trang trí bị ẩn khỏi trình đọc màn hình (mặc định); icon mang nghĩa có `accessibilityLabel`; nút chỉ icon dùng `<IconButton accessibilityLabel>`.

---

## 8. Bố cục & điều hướng — [Dự án] + [Làm mới]

| Bề rộng | Điều hướng | Nội dung |
|---------|------------|----------|
| < 768px | **Thanh tab kính mờ nổi**: viên thuốc cách đáy `max(safe area, 12)`, lề 8, `BlurView` + lớp `glass`, 5 mục icon + nhãn; mục đang chọn là viên **ink** chữ trắng | Lề 16, 1 cột. `Screen` / `StickyActionBar` / Toast tự chừa chỗ qua `useFloatingTabBarSpace` |
| ≥ 768px | Sidebar trái: logo, MENU 5 mục (đang chọn: nền ink chữ trắng), Thông báo, thẻ người dùng + đăng xuất | Lề 32, tối đa 1100px, lưới 12 cột `Grid`/`Col` |

Breakpoint (`useBreakpoint`): mobile < 768 ≤ tablet < 1024 ≤ desktop < 1280 ≤ wide.

---

## 9. Thông số component

| Component | Thông số | Nguồn |
|-----------|----------|-------|
| **Button** | `primary` nền `action` (cam đậm) → hover `actionHover` → nhấn `actionPressed`, **chữ trắng** · `secondary` nền `primary.50` → `100` → `200`, chữ `textBrand` · `outline` trắng viền `borderStrong` → hover `surfaceSunken` · `ghost` trong suốt → `surfaceSunken` · `danger` trắng viền `danger.100`, chữ `danger.700` · `inverse` nền ink chữ trắng. Cao 44/48/52, bo `lg`, chữ `subhead` (sm: `captionStrong`), `loading` + `aria-busy`, `disabled` opacity 0.5, prop `brand` cho logo Google/Apple. Mỗi màn tối đa 1 nút primary. | [Làm mới] + [Skill] |
| **Card** | `variant`: `elevated` (mặc định: trắng, `soft`, không viền) · `outlined` (viền mảnh, lồng trong vùng trắng) · `sunken` (nền cát, khối số liệu). `radius` mặc định `2xl` (24), `3xl` cho thẻ nổi bật. Bấm được: hover `raised`, nhấn opacity 0.85, `hoverLift` dịch lên 4px. | [Làm mới] |
| **MoneySummaryCard** | **Thẻ tổng tiền nền ink**, bo 28, bóng `raised`: đầu thẻ tự do (mã, trạng thái…), nhãn + tổng `display` `numeric`, thanh tiến độ trên track trắng 16% (cam → xanh lá khi 100%) **kèm chữ %**, hàng số liệu (đã trả / còn lại — "còn lại" tô mật ong), footer tùy chọn. Dùng ở Trang chủ, Chi tiết hợp đồng, Thanh toán. | [Làm mới] |
| **KeyValueRow** | Nhãn `caption` mờ – giá trị `captionStrong` căn phải, đường kẻ mảnh, cao ≥ 44. `copyable`: cả dòng là nút "Chạm để sao chép" (expo-clipboard) + toast "Đã sao chép …", icon copy, hover nền nhạt. `numeric` cho mã/số. | [Làm mới] |
| **Chip lọc** | Viên thuốc cao 44: thường = thẻ trắng `soft` (hover `surfaceSunken`), **đang chọn = nền ink chữ trắng** (hover `inverseHover`); số lượng trong viên nhỏ. `role="tab"` trong `role="tablist"`, `chipRow` xuống dòng. | [Làm mới] |
| **Tabs** | Thanh phân đoạn: nền `surfaceSunken` bo full, tab chọn là viên trắng `soft` chữ đậm; hover tab thường nền `border`, tab chọn `raised`. WAI-ARIA Tabs, roving tabindex, ←/→/Home/End. | [Làm mới] + [Skill] |
| **Input** | Nhãn phía trên; ô "mềm" nền `surfaceSunken` viền cùng màu, bo `lg`, cao 48 → hover viền `borderStrong` → focus nền trắng + viền `focusRing` + halo; lỗi viền/chữ đỏ 600/700 kèm icon (`aria-describedby`, `role="alert"`); nút hiện/ẩn mật khẩu tròn 44. | [Làm mới] + [Skill] |
| **Badge** | Viên thuốc pastel (§1.3), chữ `label`, tùy chọn chấm/icon; một dòng, không co. | [Mockup] |
| **ProgressBar** | Cao 8, bo full, track `surfaceSunken` (trên ink: `inverseTrack` qua `onInverse`), fill `primary` → `success` khi 100%; `accessibilityValue` + nhãn chữ. | [Mockup] |
| **IconButton** | Tròn 44: `soft` (trắng bóng nhẹ, trên nền trang) / `plain` (trong suốt, trong thẻ); hover `surfaceSunken`; chấm đỏ `dot` + `dotLabel`. | [Làm mới] |
| **IconCircle** | Ô **tròn** nền pastel, icon nét đậm cùng tông. | [Làm mới] |
| **ActionTile** | Thẻ trắng bo 24 `soft`, `IconCircle` + nhãn; hover nền pastel theo tông + `raised`. | [Làm mới] |
| **ScreenHeader** | Tiêu đề `title` + phụ đề `caption`; nút quay lại tròn trắng `soft`. | [Làm mới] |
| **Section** | Tiêu đề `heading` + nút viên thuốc "Xem tất cả" (nền `primary.50`, hover `primary.100`, cao 44). | [Làm mới] |
| **Toast** | Nền `inverseStrong`, chữ trắng, icon sáng; bo `xl`, `overlay`; màn hẹp nằm **trên thanh tab nổi**. `role="status"`. | [Làm mới] + [Skill] |
| **Dialog** | Bo 28, `modal`, padding 24, tiêu đề `heading`, nút đóng tròn `plain`; Esc / X / vùng tối / Back; giữ & trả focus. | [Skill] |
| **DataTable** | ≥ 1024px: khung trắng bo 24 `soft`; tiêu đề cột `label` nền `surfaceMuted`; dòng ≥ 56 kẻ mảnh; hover `primary.50`. Màn hẹp dùng thẻ. | [Skill] |
| **StickyActionBar** | Thanh trắng bo đỉnh 28, `raisedTop`; khi có thanh tab nổi, nội dung nằm ngay trên thanh tab. | [Làm mới] |
| **Checkbox** | Ô 24 bo `sm`, viền `textMuted` → chọn nền `action` + dấu tích trắng; cả hàng ≥ 44. | [Skill] |
| **TextLink** | `captionStrong` semibold `textBrand`, cao ≥ 44, hover gạch chân. | [Skill] |
| **Skeleton** | Khối `border` nhấp nháy; dừng khi giảm chuyển động. | [Skill] |
| **EmptyState / ErrorState** | Icon tròn 72 pastel, tiêu đề `heading`, mô tả `caption`, một hành động. | [Skill] |
| **BrandBanner** | Ảnh khu đô thị + gradient ink → cam đậm, bo 28, logo inverted, chữ trắng. Trang trí. | [Mockup] |
| **FormErrorSummary** | Hộp `danger` pastel bo `lg` đầu form, danh sách lỗi dạng link tới ô. | [Skill] |
| **AuthLayout** | Xem `pages/login.md`. | [Mockup] |

## 10. Hiệu ứng & chuyển động — [Skill]

- Token thời lượng `motion`: `fast` 150ms (phản hồi nhấn, hover web, toast ẩn) · `base` 200ms (toast hiện) · `slow` 300ms · `enter` 320ms + `stagger` 60ms (xuất hiện màn xác thực) · `skeleton` 800ms · `toast` 3500ms (thời gian hiển thị).
- Lớp hiển thị `zIndex`: `base` 0 · `overlay` 40 · `toast` 100.
- Phản hồi nhấn bằng màu nền/opacity, không thay đổi kích thước bố cục.
- Chỉ animate `opacity`/`transform`; tối đa 1–2 phần tử động mỗi màn hình.
- Tôn trọng giảm chuyển động: `useReducedMotion()` (native) và `@media (prefers-reduced-motion)` (web, trong `app/+html.tsx`).
- Web: `:focus-visible` hiện viền 2px `focusRing` (`primary.700`, ≥ 3:1 trên mọi nền sáng); `cursor: pointer` cho mọi phần tử bấm (`interactive` trong `theme/motion.ts`).
- **Mọi phần tử tương tác có trạng thái hover nhìn thấy được** (web) qua `useHover()` (`hooks/useHover.ts`): nút đổi nền theo biến thể; chip thường nền `surfaceSunken`, chip/tab/mục đang chọn ink → `inverseHover`; link chữ gạch chân; thẻ bấm được bóng `raised` (thẻ danh sách thêm `hoverLift`); dòng sao chép nền `surfaceMuted`. Hover không làm đổi kích thước.
- **Bàn phím (web)**: thứ tự Tab theo thứ tự hiển thị; liên kết **"Bỏ qua tới nội dung chính"** là phần tử focus đầu tiên (ẩn cho tới khi focus, chuyển focus tới vùng `role="main"` của `Screen`); tab nội dung dùng ←/→/Home/End; hộp thoại giữ focus, Esc đóng.
- **Giảm chuyển động**: Skeleton dừng nhấp nháy, `FadeIn`/Toast/Dialog không hiệu ứng, chuyển màn Stack `animation: 'none'` (native), CSS transition/animation ~0ms (web).

## 11. Phong cách — [Làm mới] trên nền [Mockup]

**"Bo tròn – Mật ong & Cà phê":** nền cát rất sáng, thẻ trắng bo 24 nổi nhẹ bằng bóng ấm (không viền), một khối nền đậm cà phê cho con số quan trọng nhất của màn (tổng tiền) với thanh tiến độ cam, điểm nhấn cam cho hành động, badge pastel cho trạng thái, chip/tab chọn nền đậm, thanh tab kính nổi trên mobile, số tiền chữ số đều `2.500.000.000 đ`.

**Khác app tham khảo (Beeland Sales) có chủ đích:** cam thương hiệu BeeSky `#F08A24` + nút cam mật ong `#A9520A` (không dùng `#C9501A`), thang xám ấm thay slate, màu đậm nâu cà phê `#2B2019` thay navy `#16233B`, giữ sidebar + lưới 12 cột cho web, không dùng `hitSlop` / emoji / cắt chữ.

## 12. Anti-patterns — không được dùng

- ❌ Mã hex, `rgba()` hoặc số pixel viết trực tiếp ngoài `theme/` (dùng token) — [Skill] `color-semantic`
- ❌ Emoji làm icon; dùng bộ icon khác ngoài lucide (qua `<Icon name>`); import thẳng component lucide trong màn hình — [Skill] + [Làm mới]
- ❌ Chữ cam `primary.500` trên nền trắng; chữ `gray.400`; **chữ trắng trên cam sáng `#F08A24`** (nút chính dùng `action`) — [Skill] tương phản
- ❌ Viền + bóng cùng lúc trên thẻ; `overflow: hidden` trên thẻ có bóng (cắt ảnh ở lớp riêng) — [Làm mới]
- ❌ Màu đậm khác ngoài `ink` (navy, đen thuần) cho khối nổi bật; nhiều hơn một thẻ ink ở cùng tầng thị giác của một màn — [Làm mới]
- ❌ Thêm font thứ hai; cỡ chữ < 12 — [Làm mới]
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
- ❌ Glassmorphism / blur ngoài **thanh tab nổi mobile**; gradient ngoài logo / ảnh nền màn xác thực / banner thương hiệu — [Mockup] + [Làm mới]
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
- [ ] Không emoji; mọi icon là lucide qua `<Icon name>` (tên trong `theme/icons.ts`), cỡ theo `sizes.icon`
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
- [ ] Safe area tôn trọng; nội dung không bị thanh tab nổi / thanh dính / toast che
- [ ] Desktop: nội dung ≤ 1100px căn giữa, sidebar hoạt động

**Trợ năng** — [Skill]
- [ ] Tương phản chữ ≥ 4.5:1 (chữ lớn ≥ 3:1) — không còn ngoại lệ (§1.4)
- [ ] Màu không phải tín hiệu duy nhất
- [ ] Giảm chuyển động được tôn trọng (§10); cỡ chữ hệ thống lớn không vỡ bố cục
- [ ] Lỗi form nằm ngay dưới ô, được thông báo cho trình đọc màn hình

**Kỹ thuật** — [Dự án]
- [ ] `npx tsc --noEmit`, `npx expo lint` và `npm test` (tương phản token) sạch
- [ ] `npx expo export --platform web` thành công; `npx expo-doctor` không có lỗi mới
