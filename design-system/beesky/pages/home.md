# Trang: Trang chủ (`app/(app)/index.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill: `"dashboard card hierarchy" --domain ux` (heading tuần tự, thang chữ nhất quán), `"notification list"` (không có kết quả → thử lại `"unread badge count"`: số chưa đọc phải là cụm từ đầy đủ, không đọc số trần), `"visual hierarchy"` (hover cho phần tử bấm được trên web).

## Khác Master
- Không dùng `ScreenHeader`; thay bằng **header chào**: `Avatar md` + lời chào + ngày (`formatWeekdayDate`, ví dụ "Thứ Năm, 01/10/2026") + `IconButton` chuông.
  - Mobile (< 768px): "Xin chào," (`caption`, `textMuted`) ở dòng trên, tên `title` dòng dưới (không ngắt giữa tên); cả khối là một header đọc liền "Xin chào, {tên}".
  - ≥ 768px: một dòng `title` "Xin chào, {tên}" (tối đa 2 dòng, không cắt).
- **Thẻ tổng quan nền ink** (`MoneySummaryCard`, desktop 7 cột cạnh banner 5 cột; mobile trên banner): "Tổng quan thanh toán" + "a/b hợp đồng đang hiệu lực", tổng giá trị `display`, thanh tiến độ + chữ %, Đã thanh toán / Còn lại — số liệu từ `useDashboard` (đã có sẵn). Đang tải: Skeleton bo 28; lỗi: `ErrorState`.
- Tiêu đề khối dùng `Section`: nút **viên thuốc** "Xem tất cả" / "Lịch thanh toán" nền `primary.50`.
- Chuông: **chấm đỏ** (`danger.600`, viền trắng) khi có thông báo chưa đọc — **không hiển thị số**; tên truy cập là cụm từ đầy đủ: "Thông báo, 2 thông báo chưa đọc" (`lib/notification.ts` → `unreadLabel`).
- **Banner thương hiệu** (`BrandBanner`): ảnh khu đô thị + gradient cam ngang (`brandTintStrong` → `brandTint`, đủ đậm cho chữ trắng ≥ 4.5:1), bo `xl`, logo `sm` inverted, tiêu đề + mô tả trắng. Chỉ trang trí, không bấm được.
- Không còn thẻ tổng quan gradient và danh sách hợp đồng trên Trang chủ (đã có ở Hợp đồng / Thanh toán).

## Bố cục — lưới 12 cột (`Grid` / `Col`) trong container tối đa 1100px
| Khối | Mobile (< 768) | Tablet (768–1023) | Desktop (≥ 1024) |
|------|----------------|-------------------|------------------|
| Header | 12 | 12 | 12 |
| Banner | 12, cao tối thiểu `sizes.banner.mobile` | 12 | 12, cao `sizes.banner.wide` |
| 4 ô chức năng | 4 × span 3, gutter `sm`, `compact` | 4 × span 3, gutter `md` | 4 × span 3, gutter `md` |
| Thông báo | 12 | 12 | **7** |
| Thanh toán sắp tới | 12 | 12 | **5** |

Gutter lưới ngoài: `md` (mobile/tablet), `lg` (desktop). Thứ tự đọc: Header → Banner → Ô chức năng → Thông báo → Thanh toán sắp tới.

## Thành phần chính
- **`ActionTile` × 4**: Hợp đồng (`primary`, `document-text`) · Thanh toán (`info`, `calendar`) · Phiếu thu (`success`, `receipt`) · Hồ sơ (`warning`, `person`) → `/contracts`, `/payments`, `/receipts`, `/profile`.
- **Thông báo** (`Section` + "Xem tất cả" → `/notifications`): 3 thông báo mới nhất từ `getNotifications()` qua `useLatestNotifications(3)`; `NotificationItem` có icon theo loại (`notificationTypeMeta`), chưa đọc = nền `primary.50` + chấm cam + "Chưa đọc" trong tên truy cập. Bấm → đánh dấu đã đọc (chấm đỏ chuông cập nhật ngay) rồi mở `link`.
- **Thanh toán sắp tới** (`Section` + "Lịch thanh toán" → `/payments`): thẻ quá hạn (nền `danger` pastel, "Quá hạn N ngày") cho từng đợt quá hạn, sau đó `NextPaymentCard` của đợt gần nhất chưa quá hạn (badge "Còn N ngày"). Số ngày tính ở `lib/payment.ts` (`daysUntilDue`) và định dạng ở `lib/format.ts` (`formatDaysLeft`), không tính trong component.

## Trạng thái (mỗi khối độc lập)
| Khối | Đang tải | Lỗi | Rỗng |
|------|----------|-----|------|
| Thông báo | 3 `Skeleton` cao `sizes.skeleton.row` | `ErrorState` + Thử lại trong `Card` | `EmptyState` "Chưa có thông báo" |
| Thanh toán sắp tới | `SkeletonCard` | `ErrorState` + Thử lại trong `Card` | `EmptyState` "Không có khoản sắp đến hạn" (khi không có cả đợt quá hạn) |
| Chuông | Không chấm khi chưa tải xong | Không chấm | Không chấm |

Kéo để làm mới (mobile): làm mới cả hai khối.
