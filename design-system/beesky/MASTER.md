# BeeSky – Design System Master

> **QUY TẮC ĐỌC:** Khi làm một màn hình, đọc file này trước, sau đó đọc `design-system/beesky/pages/<màn>.md`.
> Nếu file của màn hình tồn tại, quy tắc trong đó **ghi đè** file Master này. Nếu không có, tuân thủ Master.

**Dự án:** BeeSky – ứng dụng khách hàng bất động sản (hợp đồng, lịch thanh toán, phiếu thu, nhà ở xã hội)
**Nền tảng:** Expo SDK 57 + React Native + react-native-web (iOS, Android, Web), NativeWind v4
**Cập nhật:** 2026-10-02 · **bảng màu "Xanh trời"** cho app khách hàng — không dùng màu chủ đạo công ty (cam): xanh trời `#38BDF8` / nút `#0A74B8`, xám slate, khối đậm xanh đêm `#0B2A44`, nền `#F3F8FC`; `info` chuyển sang chàm (indigo) để không trùng màu nhấn. Hình khối đồng bộ app Beeland Sales (`beeland-app_2026`): thanh tab kính chỉ icon có viên sáng trượt, lề mobile 20, tiêu đề khối có nút viên nhỏ, ô chức năng trắng bo 20.

### Nguồn của từng quyết định

| Nhãn | Ý nghĩa |
|------|---------|
| **[Mockup]** | Bản sắc BeeSky (màu nhấn, nền sáng, badge pastel, thanh tiến độ, timeline). Khi skill mâu thuẫn, mockup thắng. |
| **[Làm mới]** | Phong cách của bản làm mới 2026-10 — hình khối đồng bộ app Beeland Sales (`beeland-app_2026`), màu riêng "Xanh trời". |
| **[Skill]** | Lấy từ skill `ui-ux-pro-max` (chỉ những phần không mâu thuẫn mockup). |
| **[Dự án]** | Quyết định kỹ thuật/kiến trúc của dự án (yêu cầu ban đầu hoặc ràng buộc nền tảng). |

**Mã nguồn token:** mọi giá trị dưới đây nằm trong `theme/tokens.json` — bảng màu, **vai trò màu (`semantic`) và cặp sắc thái (`tone`) khai báo dạng tham chiếu** `"gray.900"`, được `theme/colors.ts` và test tương phản cùng đọc. Component **không** được viết mã hex hay số pixel trực tiếp.

---

## 1. Màu sắc — [Mockup] + [Làm mới]

### 1.1 Ba nhóm màu

| Nhóm | Vai trò | Ghi chú |
|------|---------|---------|
| **Xanh trời** `primary` | Màu nhấn (500 `#38BDF8`) + **xanh đậm** cho nút chính và chữ nhấn (700 `#0A74B8`) | Xanh sáng chỉ để trang trí; chữ/nền chữ dùng 700 trở lên |
| **Slate** `gray` | Thang trung tính xanh xám | |
| **Xanh đêm** `ink` | Màu đậm: thẻ tổng tiền, chip đang chọn, toast | `#0B2A44` |

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `primary.50` / `100` / `200` | `#F0F9FF` / `#E0F2FE` / `#BAE6FD` | Nền pastel (badge, nút phụ, thông báo chưa đọc, nút "Xem tất cả") / hover / viền hover |
| `primary.300` / `400` | `#7DD3FC` / `#5CC8FA` | Gradient logo |
| **`primary.500`** | **`#38BDF8`** | **Nhấn**: thanh tiến độ, chấm chưa đọc, gradient — không đặt chữ trắng lên (2.14:1) |
| `primary.600` | `#0EA5E9` | Cuối gradient logo, `brandPressed` |
| **`primary.700`** | **`#0A74B8`** | **Nút chính** (`action`), chữ nhấn (`textBrand`), viền focus, icon tab đang chọn |
| `primary.800` / `900` | `#08629C` / `#0C4A6E` | Nút chính hover / nhấn, chữ badge `primary`, lớp phủ banner |
| `gray.50 … 900` | `#F8FAFC` `#F1F5F9` `#E4E7EC` `#CBD5E1` `#94A3B8` `#64748B` `#475569` `#334155` `#1E293B` `#0F172A` | Nền, viền, chữ |
| `ink.600 … 900` | `#24496B` `#173A5C` `#0B2A44` `#071D33` | Nền đậm (800 mặc định, 700 hover, 900 toast) |
| `onInk` | chữ `#FFFFFF` · phụ `#BFD9EC` · nhấn **xanh nhạt `#7DD3FC`** · track/divider trắng 16% / 12% | Nội dung trên nền đậm |
| `background` | `#F3F8FC` | Nền màn hình (trắng ngả xanh rất nhạt) |

### 1.2 Màu theo vai trò (`tokens.json` → `semantic`)

| Vai trò | Token | Tham chiếu |
|---------|-------|-----------|
| Nền trang / thẻ / phụ / lõm | `bg` / `surface` / `surfaceMuted` / `surfaceSunken` | `background` / trắng / `gray.50` / `gray.100` |
| Viền / viền đậm / viền hover | `border` / `borderStrong` / `borderHover` | `gray.200` / `gray.300` / `primary.200` |
| Chữ chính / phụ / mờ / placeholder | `text` / `textSecondary` / `textMuted` / `placeholder` | `gray.900` / `700` / `600` / `600` |
| Chữ nhấn, chữ thành công | `textBrand` / `textSuccess` | `primary.700` / `success.700` |
| **Nút chính** | `action` → `actionHover` → `actionPressed`, chữ `textOnAction` | `primary.700` → `800` → `900`, trắng |
| Nền xanh dương sáng (hiếm) | `brand`, chữ `textOnBrand` | `primary.500`, `gray.900` |
| **Nền đậm** | `inverse` / `inverseHover` / `inverseStrong` | `ink.800` / `700` / `900` |
| Chữ trên nền đậm | `onInverse` / `onInverseMuted` / `onInverseAccent` | trắng / `onInk.muted` / xanh nhạt |
| Thanh tiến độ & đường kẻ trên nền đậm | `inverseTrack` / `inverseDivider` | trắng 16% / 12% |
| Thanh tab kính | `glass` / `glassBorder` / `glassActive` | xanh xám 10% trên blur / trắng 45% / viên tab đang chọn trắng 60% |
| Focus | `focusRing` / `focusHalo` | `primary.700` / `primary.100` |
| Icon | `icon` / `iconMuted` | `gray.700` / `gray.400` (chỉ trang trí, không dùng cho chữ) |

**Lớp phủ** (`colors.overlay`): `heroScrim` (xanh đêm 62% phía trên ảnh hero mobile) · `authFadeStart` / `authFadeMid` (nền trang 0% / 55%) · `brandTint` (xanh `primary.800` 90%) → `brandTintStrong` (xanh đêm 92%) — gradient panel đăng nhập & banner · `scrim` (xanh đêm 45%, sau hộp thoại).

### 1.3 Màu trạng thái — badge pastel [Mockup]

Mỗi sắc thái có cặp **nền pastel + chữ đậm cùng tông** (`tokens.json` → `tone`, `toneColors` trong code):

| Sắc thái | Nền | Chữ | Đậm (thanh/chấm) | Dùng cho |
|----------|-----|-----|------------------|----------|
| `success` | `#ECFDF3` | `#166534` | `#16A34A` | Đã thanh toán, đang hiệu lực, thanh tiến độ 100% |
| `info` | `#EEF2FF` | `#4338CA` | `#6366F1` | Thông tin (chàm — khác màu nhấn xanh trời) |
| `danger` | `#FEF2F2` | `#B91C1C` | `#EF4444` | Quá hạn, lỗi, đăng xuất |
| `warning` | `#FFFBEB` | `#B45309` | `#F59E0B` | Chờ xác nhận |
| `primary` | `#F0F9FF` | `#08629C` | `#38BDF8` | Đến hạn, thanh toán một phần |
| `neutral` | `#F1F5F9` | `#334155` | `#64748B` | Chưa đến hạn, đã hủy |

### 1.4 Tương phản — kiểm bằng **test tự động** (`npm test`) + kiểm định giao diện (§13)

`tests/contrast.test.cjs` đọc `tokens.json` và kiểm **70 cặp** (chữ ≥ 4.5:1, icon / viền focus / thanh tiến độ ≥ 3:1, icon tab trên kính, lớp phủ tính trên vùng sáng nhất của ảnh). Đổi token làm hỏng cặp nào → test đỏ.

| Cặp | Tỷ lệ |
|-----|-------|
| Chữ trắng trên **nút chính** `#0A74B8` / hover / nhấn | **5.00** / 6.49 / 9.46:1 |
| `textBrand` (`#0A74B8`) trên trắng / trên `bg`; badge `primary` trên `primary.50` | 5.00 / 4.67; 6.08:1 |
| `text` / `textSecondary` / `textMuted` trên trắng | 17.9 / 10.4 / 7.58:1 (`textMuted` trên `bg`: 7.09) |
| `placeholder` trên trắng / trên ô nhập `surfaceSunken` | 7.58 / 6.92:1 |
| Trên xanh đêm `#0B2A44`: trắng / chữ phụ / xanh nhạt / thanh tiến độ | 14.7 / 10.0 / 8.81 / 6.86:1 |
| `textOnBrand` (gray-900) trên xanh trời `#38BDF8` | 8.33:1 |
| ~~Chữ trắng trên `#38BDF8`~~ | 2.14:1 ❌ không dùng |

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
| `md` | 16 | Padding thẻ |
| `ml` | 20 | **Lề mobile** (`layout.gutterMobile`, giống Beeland Sales), padding thẻ lớn, khoảng cách khối |
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
| `xl` | 20 | Ô chức năng (ActionTile), khối số tiền trong hộp thoại, thẻ người dùng sidebar, thẻ cảnh báo nhỏ |
| **`2xl`** | **24** | **Thẻ ở màn chính** (Card mặc định), bảng, thông báo |
| **`3xl`** | **28** | **Thẻ tổng tiền**, banner, hộp thoại, thẻ form xác thực, đỉnh StickyActionBar |
| `full` | 9999 | Chip, badge, tab phân đoạn, nút tròn, avatar, thanh tiến độ, thanh tab nổi |

## 5. Đổ bóng — 4 mức [Làm mới]

Bóng slate (`rgba(15, 23, 42, α)`), **thẻ dùng bóng thay cho viền**:

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
| `sizes.chipCompact` | 36 | Chip gọn `size="sm"` (lọc mã căn); `hitSlop` bù vùng chạm lên 44 |
| `sizes.roundThumb` | 88 | Ảnh vuông thẻ đợt nhận hồ sơ (dạng ngang) |
| `sizes.scheduleDate` | 64 | Khối ngày trên thẻ lịch bàn giao (tháng · ngày · thứ) |
| `sizes.control` | sm 44 · md 48 · lg 52 | Nút / chip / ô nhập — **không dùng hitSlop để bù** |
| `sizes.icon` | xs 12 · sm 16 · md 20 · lg 24 · xl 32 | |
| `sizes.iconBox` | sm 36 · md 40 · lg 44 · xl 48 · hero 72 | Ô icon tròn (`IconCircle`) |
| `sizes.avatar` | sm 36 · md 44 · lg 64 | |
| `sizes.checkbox` | 24 | |
| `sizes.tabBar` | cao 54 · mỗi ô 64 · đệm 5 · blur 95 | Thanh tab kính nổi (mobile), chỉ icon — giống Beeland Sales |
| `sizes.moneyCard.statMinWidth` | 120 | Cột số liệu trong thẻ tổng tiền (xuống dòng khi hẹp) |
| `sizes.projectImage` | 184 | Ảnh dự án trên thẻ (ảnh thật, phủ gradient `overlay.imageScrim*`, chữ trắng đè ảnh) |
| `sizes.roundImage` · `pickerList` · `formColumnMin` | 140 · 320 · 240 | Nhà ở xã hội: ảnh thẻ đợt · danh sách chọn tỉnh/xã · bề rộng tối thiểu một cột form 2 cột |
| `sizes.lotteryDrum` | mobile 200 · wide 260 | Lồng cầu bốc thăm NOXH |
| `layout.contentMaxWidth` / `sidebarWidth` | 1100 / 248 | [Dự án] |

## 7. Icon — [Làm mới]

- **Một bộ duy nhất: Phosphor Icons** (`phosphor-react-native`, đổi từ lucide ngày 2026-10-02 cho hiện đại hơn). Đặc điểm: bo tròn mềm, SVG qua `react-native-svg`.
  - Gọi bằng **tên ngữ nghĩa** `<Icon name="document" />`; bảng tên ↔ icon ở `theme/icons.ts` (đổi bộ icon chỉ sửa file này).
  - Import từng icon (`phosphor-react-native/src/icons/<Tên>`) để bản build chỉ chứa icon dùng tới.
- **Kiểu nét** `variant` (`IconVariant`):
  - `line` (mặc định) — nút, dòng thông tin;
  - `bold` (= `strong`) — chevron nhỏ, dấu tích, icon trên nền màu;
  - **`fill`** — tab / mục sidebar đang chọn;
  - **`duotone`** (nền mờ 28% cùng màu) — mọi icon trong ô tròn (`IconCircle`: ô chức năng, thông báo, trạng thái) và khối "đợt tiếp theo".
- Logo Google / Apple: `<BrandMark>` (đường vẽ Simple Icons, CC0) — bộ icon không có logo thương hiệu.
- **Không dùng emoji**. Icon trang trí bị ẩn khỏi trình đọc màn hình (mặc định); icon mang nghĩa có `accessibilityLabel`; nút chỉ icon dùng `<IconButton accessibilityLabel>`.

---

## 8. Bố cục & điều hướng — [Dự án] + [Làm mới]

| Bề rộng | Điều hướng | Nội dung |
|---------|------------|----------|
| < 768px | **Thanh tab kính mờ nổi** (giống Beeland Sales): viên thuốc gọn căn giữa, cách đáy `max(safe area, 12)`, `BlurView` + lớp `glass`, 5 ô **chỉ icon** — Trang chủ · Hợp đồng · **Nhà ở XH** (giữa, icon `building`) · Thanh toán · Cá nhân (2026-10-05) (nhãn qua `accessibilityLabel`); tab đang chọn nằm trong viên kính sáng `glassActive` **trượt** (spring), icon `action` nét đậm, icon thường `inverse` | Lề 20, 1 cột. `Screen` / `StickyActionBar` / Toast tự chừa chỗ qua `useFloatingTabBarSpace` |
| ≥ 768px | Sidebar trái: logo, MENU 5 mục (đang chọn: nền ink chữ trắng; mục NOXH dùng nhãn đầy đủ "Nhà ở xã hội"), Thông báo, thẻ người dùng + đăng xuất | Lề 32, tối đa 1100px, lưới 12 cột `Grid`/`Col` |

Breakpoint (`useBreakpoint`): mobile < 768 ≤ tablet < 1024 ≤ desktop < 1280 ≤ wide.

**Phiếu thu gộp vào Thanh toán** (2026-10-05): màn Thanh toán có `LineTabs` **Cần thanh toán** (lịch thanh toán chưa trả) | **Đã thanh toán** (phiếu thu), tab nằm trên URL `/payments?tab=paid`. Route `/receipts` chuyển hướng sang tab Đã thanh toán; `/receipts/[id]` (chi tiết phiếu) giữ nguyên, khi mở thì tab Thanh toán sáng (`activeNavName` trong `navItems.ts`). Không còn thanh phân đoạn `PaymentsSegment`.

**Quay lại trong nhánh** (2026-10-06): `noxh/_layout` và `contracts/_layout` khai báo `unstable_settings = { anchor: 'index' }`; mở màn con từ tab khác (lưới "Quản lý" ở Cá nhân, thẻ việc NOXH ở Trang chủ, thông báo) dùng `router.push(href, { withAnchor: true })` → màn gốc của nhánh nằm dưới, "Quay lại" về Tổng quan NOXH / danh sách Hợp đồng thay vì thoát ra Trang chủ. Không đặt anchor cho `receipts` (màn gốc chỉ chuyển hướng sang Thanh toán).

**Tiêu đề có nút quay lại được ghim** (2026-10-06, mobile < 768): `ScreenHeader` có `onBack` đăng ký vào `Screen` (context `ScreenHeaderSlot`) thay vì vẽ trong nội dung cuộn; `Screen` vẽ nó cố định trên vùng cuộn (`ScreenHeaderView compact`: tiêu đề / phụ đề một dòng, nền `bg`, `zIndex.sticky` = 10, **không viền / không bóng** — kiểu AppHeader "soft" của beeland-app_2026). Thanh bám dính (tab, bộ lọc) dính ngay dưới. Áp dụng tự động cho mọi màn có nút quay lại; desktop giữ tiêu đề tại chỗ (cùng Breadcrumb).

**Bo góc đồng bộ beeland-app_2026** (2026-10-06): nút `Button` = **viên thuốc** (`radius.full`, như các màn 2026 đã làm lại); thẻ `Card` 24 (`2xl` = 2026 `xxl`), hộp thoại 28, toast 20; ô nhập `Input` / `SelectField` **20** (`xl`); khối / dòng tô nền bên trong thẻ (khối tiến độ, ghi chú, lý do, dòng menu, dòng chọn trong hộp thoại, mục sidebar) **20** (`xl`); ô nhỏ (ô số liệu, ghi chú lịch, dòng sao chép) **16** (`lg`); checkbox 8. Thanh tiêu đề ghim / thanh bám dính không còn dải bóng chữ nhật. Danh sách thông báo (Trang chủ + màn Thông báo) cùng một kiểu thẻ chia dòng `ListRow`.

**Mã dài trong thẻ danh sách** (2026-10-06): mã hợp đồng / booking / phiếu thu / hồ sơ trong thẻ (`InstallmentCard`, `ReceiptCard`, `ContractCard`, `ApplicationCard`, `LotteryCard`, thẻ bốc thăm nổi bật, bảng thanh toán) **tối đa 2 dòng rồi "…"** (`numberOfLines={2}`); thông tin quan trọng đi kèm (khung giờ, ngày) tách dòng riêng để không bị cắt. Màn chi tiết (`KeyValueRow`) vẫn hiện đầy đủ + sao chép được.

**Màn danh sách — thanh bám dính (2026-10-02, bắt buộc cho mọi màn có danh sách + bộ lọc).** Dùng `Screen top={…} sticky={(collapsed) => …}`:
- **`top`**: phần cuộn đi bình thường — `ScreenHeader`, cảnh báo, thẻ tổng quan lớn (`MoneySummaryCard`, thẻ tổng phiếu thu…).
- **`sticky`**: bám đầu màn khi cuộn (nền `bg`, không đổ bóng — kiểu soft) — bộ lọc (`ChipBar` một dòng vuốt ngang, ô tìm, `Tabs`).
- Khi `collapsed` (thẻ lớn đã cuộn khỏi màn) thêm **`CompactSummary`**: một dòng tổng quan gọn (nhãn + số tiền + phần trăm / thanh tiến độ mảnh) — khách luôn thấy con số chính mà không mất nửa màn hình.
- Thanh trạng thái có nền riêng (`Screen` đệm `safe area` ở ngoài ScrollView) để thanh bám dính không nằm dưới tai thỏ.
- Đang áp dụng: Thanh toán, Phiếu thu, Hợp đồng, Thông báo (số chưa đọc + "Đọc tất cả"), Chi tiết hợp đồng (thanh tab).

---

## 9. Thông số component

| Component | Thông số | Nguồn |
|-----------|----------|-------|
| **Button** | `primary` nền `action` (xanh đậm) → hover `actionHover` → nhấn `actionPressed`, **chữ trắng** · `secondary` nền `primary.50` → `100` → `200`, chữ `textBrand` · `outline` trắng viền `borderStrong` → hover `surfaceSunken` · `ghost` trong suốt → `surfaceSunken` · `danger` trắng viền `danger.100`, chữ `danger.700` · `inverse` nền ink chữ trắng. Cao 44/48/52, bo `lg`, chữ `subhead` (sm: `captionStrong`), `loading` + `aria-busy`, `disabled` opacity 0.5, prop `brand` cho logo Google/Apple. Mỗi màn tối đa 1 nút primary. | [Làm mới] + [Skill] |
| **Card** | `variant`: `elevated` (mặc định: trắng, `soft`, không viền) · `outlined` (viền mảnh, lồng trong vùng trắng) · `sunken` (nền slate nhạt, khối số liệu). `radius` mặc định `2xl` (24), `3xl` cho thẻ nổi bật. Bấm được: hover `raised`, nhấn opacity 0.85, `hoverLift` dịch lên 4px. | [Làm mới] |
| **MoneySummaryCard** | **Thẻ tổng tiền nền xanh đêm (`ink`)**, bo 28, bóng `raised`: đầu thẻ tự do (mã, trạng thái…), nhãn + tổng `display` `numeric`, thanh tiến độ trên track trắng 16% (xanh trời → xanh lá khi 100%) **kèm chữ %**, hàng số liệu (đã trả / còn lại — "còn lại" tô xanh nhạt), footer tùy chọn. Dùng ở Trang chủ, Chi tiết hợp đồng, Thanh toán. | [Làm mới] |
| **KeyValueRow** | Nhãn `caption` mờ – giá trị `captionStrong` căn phải, đường kẻ mảnh, cao ≥ 44. `copyable`: cả dòng là nút "Chạm để sao chép" (expo-clipboard) + toast "Đã sao chép …", icon copy, hover nền nhạt. `numeric` cho mã/số. | [Làm mới] |
| **ChipBar** | Hàng chip **một dòng vuốt ngang**, tràn sát mép màn — chỉ dùng trong thanh bám dính (ngoại lệ có chủ đích của quy tắc chip xuống dòng `chipRow`, để thanh bám luôn thấp). | [Làm mới] |
| **CompactSummary** | Thẻ trắng bo `xl` bóng `soft`: nhãn `label` + giá trị `subhead` đậm, phần phải tuỳ chọn, thanh tiến độ mảnh `sm`. Chỉ hiện trong thanh bám dính khi `collapsed`. | [Làm mới] |
| **Chip lọc** | Viên thuốc cao 44: thường = thẻ trắng `soft` (hover `surfaceSunken`), **đang chọn = nền ink chữ trắng** (hover `inverseHover`); số lượng trong viên nhỏ. `role="tab"` trong `role="tablist"`, `chipRow` xuống dòng. | [Làm mới] |
| **Chip gọn / UnitFilterBar** | `Chip size="sm"` cao 36, chữ `caption` đậm, một dòng. `UnitFilterBar`: hàng "Tất cả · <mã căn>" vuốt ngang ở Hợp đồng / Lịch thanh toán / Phiếu thu, lọc ngay trên máy; khách chỉ có 1 căn → ẩn. | 2026-10-05 |
| **LineTabs** | Tab gạch chân lọc trạng thái trong một màn (chữ đậm + vạch `brand` dưới tab chọn, kẻ mảnh `border` suốt hàng, số lượng cạnh nhãn). Khác `Tabs` (thanh phân đoạn chuyển màn) để hai tầng không trông giống nhau. Tab rộng theo nội dung (nhãn không bị cắt); `id` để nối `TabPanel`. Dùng ở Thanh toán và Chi tiết hợp đồng. | 2026-10-05 |
| **QuickActions** | Hàng chức năng nhanh: MỘT thẻ trắng `soft` bo `2xl` chia đều 4 cột (không cuộn ngang); mỗi ô `IconCircle lg` + nhãn `label` 12 vừa, tối đa 2 dòng (vùng nhãn cố định 2 dòng để icon thẳng hàng; nhãn dài ngắt chủ động bằng `\n`), nhấn/hover nền `surfaceSunken`. Thay `ActionTile` ở Trang chủ và Nhà ở xã hội. | 2026-10-05 |
| **ListRow** | Dòng của thẻ danh sách gọn (Trang chủ: Thanh toán sắp tới, Thông báo): `IconCircle sm` · tiêu đề `captionStrong` 1 dòng (+ `value` căn phải cùng hàng, vd số tiền) · dòng phụ (1–2 dòng) · `footnote` nhỏ (thời gian) · mũi tên; `unread` = chấm + nền `primary.50`; `divider` kẻ mảnh. Nhiều dòng đặt trong MỘT `Card padding="none"` — mọi danh sách gọn cùng một kiểu. **Kiểu `card`** ("Booking gần đây" / `RecentSection` của beeland-app_2026): mỗi dòng một thẻ trắng bo 24 + bóng `soft`, icon `lg`, khối phải xếp chồng (số tiền + `Badge`), không mũi tên; các thẻ cách nhau `ms` — dùng ở Trang chủ (Thanh toán sắp tới, Thông báo) và màn Thông báo. | 2026-10-06 |
| **Tabs** | Thanh phân đoạn: nền `surfaceSunken` bo full, tab chọn là viên trắng `soft` chữ đậm; hover tab thường nền `border`, tab chọn `raised`. WAI-ARIA Tabs, roving tabindex, ←/→/Home/End. | [Làm mới] + [Skill] |
| **Input** | Nhãn phía trên; ô "mềm" nền `surfaceSunken` viền cùng màu, bo `lg`, cao 48 → hover viền `borderStrong` → focus nền trắng + viền `focusRing` + halo; lỗi viền/chữ đỏ 600/700 kèm icon (`aria-describedby`, `role="alert"`); nút hiện/ẩn mật khẩu tròn 44. | [Làm mới] + [Skill] |
| **Badge** | Viên thuốc pastel (§1.3), chữ `label`, tùy chọn chấm/icon; một dòng, không co. | [Mockup] |
| **ProgressBar** | Cao 8, bo full, track `surfaceSunken` (trên ink: `inverseTrack` qua `onInverse`), fill `primary` → `success` khi 100%; `accessibilityValue` + nhãn chữ. | [Mockup] |
| **Pressable** | **Luôn import từ `@/components/ui`**, không dùng `Pressable` của `react-native`: NativeWind làm phẳng `style={({ pressed }) => …}` nên native mất nền/bóng. Bản của dự án tự theo dõi `pressed`/`hovered` và nhận `style`/`children` dạng hàm. | [Dự án] |
| **IconButton** | Tròn 44: `soft` (trắng bóng nhẹ, trên nền trang) / `plain` (trong suốt, trong thẻ); hover `surfaceSunken`; chấm đỏ `dot` + `dotLabel`. | [Làm mới] |
| **IconCircle** | Ô **tròn** nền pastel, icon nét đậm cùng tông. | [Làm mới] |
| **ActionTile** | Thẻ trắng bo 20 `soft`, `IconCircle` + nhãn medium; trang chủ dùng một tông `primary` cho cả 4 ô; hover nền pastel theo tông + `raised`. | [Làm mới] |
| **ScreenHeader** | Tiêu đề `title` + phụ đề `caption`; nút quay lại tròn trắng `soft`. | [Làm mới] |
| **Section** | Tiêu đề `heading` (giãn, không đẩy nút xuống dòng) + nút viên thuốc nhỏ "Xem tất cả" chữ `label` + chevron (nền `primary.50`, hover `primary.100`) nằm trong vùng chạm trong suốt cao 44. | [Làm mới] |
| **Toast** | Nền `inverseStrong`, chữ trắng, icon sáng; bo `xl`, `overlay`; màn hẹp nằm **trên thanh tab nổi**. `role="status"`. | [Làm mới] + [Skill] |
| **Dialog** | Bo 28, `modal`, padding 24, tiêu đề `heading`, nút đóng tròn `plain`; Esc / X / vùng tối / Back; giữ & trả focus. | [Skill] |
| **DataTable** | ≥ 1024px: khung trắng bo 24 `soft`; tiêu đề cột `label` nền `surfaceMuted`; dòng ≥ 56 kẻ mảnh; hover `primary.50`. Màn hẹp dùng thẻ. | [Skill] |
| **StickyActionBar** | Thanh trắng bo đỉnh 28, `raisedTop`; khi có thanh tab nổi, nội dung nằm ngay trên thanh tab. | [Làm mới] |
| **Checkbox** | Ô 24 bo `sm`, viền `textMuted` → chọn nền `action` + dấu tích trắng; cả hàng ≥ 44. | [Skill] |
| **TextLink** | `captionStrong` semibold `textBrand`, cao ≥ 44, hover gạch chân. | [Skill] |
| **Skeleton** | Khối `border` nhấp nháy; dừng khi giảm chuyển động. | [Skill] |
| **EmptyState / ErrorState** | Icon tròn 72 pastel, tiêu đề `heading`, mô tả `caption`, một hành động. | [Skill] |
| **BrandBanner** | Ảnh khu đô thị + gradient xanh đêm → xanh đậm, bo 28, logo inverted, chữ trắng. Trang trí. | [Mockup] |
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

**"Xanh trời" (app khách hàng):** nền trắng ngả xanh rất nhạt, thẻ trắng bo 20–24 nổi nhẹ bằng bóng (không viền), một khối nền xanh đêm cho con số quan trọng nhất của màn (tổng tiền) với thanh tiến độ xanh trời, điểm nhấn xanh cho hành động, badge pastel cho trạng thái, chip/tab chọn nền đậm, thanh tab kính chỉ icon trên mobile, số tiền chữ số đều `2.500.000.000 đ`. Không dùng màu chủ đạo công ty (cam).

**Khác app Beeland Sales có chủ đích:** bảng màu riêng (xanh trời thay cam), giữ sidebar + lưới 12 cột cho web, vùng chạm thật ≥ 44 (không dùng `hitSlop`), không emoji, không cắt chữ thiết yếu.

## 12. Anti-patterns — không được dùng

- ❌ Mã hex, `rgba()` hoặc số pixel viết trực tiếp ngoài `theme/` (dùng token) — [Skill] `color-semantic`
- ❌ Emoji làm icon; dùng bộ icon khác ngoài Phosphor (qua `<Icon name>`); import thẳng component phosphor trong màn hình — [Skill] + [Làm mới]
- ❌ Chữ xanh sáng `primary.500` trên nền nhạt (chữ nhấn dùng `textBrand` = 700); chữ `gray.400`; **chữ trắng trên xanh sáng `#38BDF8`** (nút chính dùng `action`) — [Skill] tương phản
- ❌ Import `Pressable` từ `react-native` (style dạng hàm bị NativeWind bỏ qua trên native) — dùng `@/components/ui` — [Dự án]
- ❌ Viền + bóng cùng lúc trên thẻ; `overflow: hidden` trên thẻ có bóng (cắt ảnh ở lớp riêng) — [Làm mới]
- ❌ Màu đậm khác ngoài `ink` (xanh đêm) cho khối nổi bật (đen thuần, nâu…); nhiều hơn một thẻ ink ở cùng tầng thị giác của một màn — [Làm mới]
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
- [ ] Không emoji; mọi icon là Phosphor qua `<Icon name>` (tên trong `theme/icons.ts`), cỡ theo `sizes.icon`
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
