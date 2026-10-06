# Trang: Trang chủ (`app/(app)/index.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill: `"dashboard card hierarchy" --domain ux` (heading tuần tự, thang chữ nhất quán), `"notification list"` (không có kết quả → thử lại `"unread badge count"`: số chưa đọc phải là cụm từ đầy đủ, không đọc số trần), `"visual hierarchy"` (hover cho phần tử bấm được trên web).

## Khác Master
- Không dùng `ScreenHeader`; thay bằng **header chào kiểu Beeland Sales** (2026-10-02): lời chào + tên + ngày (`formatWeekdayDate`) + `IconButton` chuông tròn trắng `soft`. Không còn Avatar.
  - Mobile (< 768px): "Xin chào," (`caption`, `textSecondary`), tên cỡ `fontSizes.headline` (24/30, đậm), ngày (`caption`, `textMuted`); cả khối là một header đọc liền "Xin chào, {tên}. {ngày}".
  - ≥ 768px: tên dùng `title`.
- **Thẻ tổng quan nền xanh đêm (`ink`)** (`MoneySummaryCard`, desktop 7 cột cạnh banner 5 cột; mobile trên banner): "Tổng quan thanh toán" + "a/b hợp đồng đang hiệu lực", tổng giá trị `display`, thanh tiến độ + chữ %, Đã thanh toán / Còn lại — số liệu từ `useDashboard` (đã có sẵn). Đang tải: Skeleton bo 28; lỗi: `ErrorState`.
- Tiêu đề khối dùng `Section`: nút **viên thuốc nhỏ** "Xem tất cả" / "Lịch thanh toán" nền `primary.50` (chữ `label`, không đẩy xuống dòng).
- Chuông: **chấm đỏ** (`danger.600`, viền trắng) khi có thông báo chưa đọc — **không hiển thị số**; tên truy cập là cụm từ đầy đủ: "Thông báo, 2 thông báo chưa đọc" (`lib/notification.ts` → `unreadLabel`).
- **Banner thương hiệu** (`BrandBanner`): ảnh khu đô thị + gradient xanh đêm → xanh đậm (`brandTintStrong` → `brandTint`, đủ đậm cho chữ trắng ≥ 4.5:1), bo `xl`, logo `sm` inverted, tiêu đề + mô tả trắng. Chỉ trang trí, không bấm được.
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
- **`ActionTile` × 4** (cùng tông `primary`): Hợp đồng (`document`) · Thanh toán (`calendar`) · Phiếu thu (`receipt`) · Hồ sơ (`user`) → `/contracts`, `/payments`, `/receipts`, `/profile`.
- **Thông báo** (`Section` + "Xem tất cả" → `/notifications`): 3 thông báo mới nhất từ `getNotifications()` qua `useLatestNotifications(3)`; `NotificationItem` có icon theo loại (`notificationTypeMeta`), chưa đọc = nền `primary.50` + chấm xanh + "Chưa đọc" trong tên truy cập. Bấm → đánh dấu đã đọc (chấm đỏ chuông cập nhật ngay) rồi mở `link`.
- **Thanh toán sắp tới** (`Section` + "Lịch thanh toán" → `/payments`): thẻ quá hạn (nền `danger` pastel, "Quá hạn N ngày") cho từng đợt quá hạn, sau đó `NextPaymentCard` của đợt gần nhất chưa quá hạn (badge "Còn N ngày"). Số ngày tính ở `lib/payment.ts` (`daysUntilDue`) và định dạng ở `lib/format.ts` (`formatDaysLeft`), không tính trong component.

## Trạng thái (mỗi khối độc lập)
| Khối | Đang tải | Lỗi | Rỗng |
|------|----------|-----|------|
| Thông báo | 3 `Skeleton` cao `sizes.skeleton.row` | `ErrorState` + Thử lại trong `Card` | `EmptyState` "Chưa có thông báo" |
| Thanh toán sắp tới | `SkeletonCard` | `ErrorState` + Thử lại trong `Card` | `EmptyState` "Không có khoản sắp đến hạn" (khi không có cả đợt quá hạn) |
| Chuông | Không chấm khi chưa tải xong | Không chấm | Không chấm |

Kéo để làm mới (mobile): làm mới cả hai khối.

## Nhà ở xã hội (2026-10-05)
- Dưới 4 ô chức năng: **`NoxhAttentionCard`** (thẻ `sunken` bo `xl`, nền pastel theo tông, bấm được) chỉ khi có việc NOXH cần làm ngay (`noxhAttention`): bốc thăm đang mở (success, `trophy`) > bốc thăm trong 24 giờ (primary, `timer`) > hồ sơ cần bổ sung (warning, `warning`). Nhãn `label` in hoa + tiêu đề `bodyStrong` + chevron. Lỗi tải NOXH → không hiện, không ảnh hưởng các khối khác.
- Thông báo gộp cả thông báo NOXH (`noxh_lottery` timer/primary · `noxh_result` trophy/success · `noxh_cancel` closeCircle/danger), bấm mở route `/noxh/...`.

## Đổi bố cục (2026-10-05)
- **Bỏ thẻ "Tổng quan thanh toán"** (ink `MoneySummaryCard`) — tổng tiền, tiến độ xem ở Thanh toán. Banner thương hiệu chiếm cả hàng (12 cột mọi bề rộng, cao tối thiểu `sizes.banner`).
- **4 ô chức năng mới:** Hợp đồng (`document`) · Thanh toán (`calendar`) · **Yêu cầu** (`message`, `/yeu-cau`) · **Lịch bàn giao** (`calendarCheck`, `/lich-ban-giao`). Bỏ Phiếu thu (vào từ thanh phân đoạn của Thanh toán) và Hồ sơ (tab Cá nhân).
- Yêu cầu, Lịch bàn giao hiện là **màn tạm** `ComingSoonScreen` (tiêu đề + quay lại + `EmptyState` giải thích + "Về Trang chủ"); tính năng thật làm sau (dữ liệu nhân viên: `bee_handover_schedules`, Yêu cầu khách hàng `/requests` trên web — chưa có hàm cho khách).
- **Hàng ô trên điện thoại** (< 768): một dòng, vuốt ngang (`lib/tileRow.ts`). Đủ chỗ (≥ 4 × `sizes.actionTile.minWidth` 92 + khe 8) → 4 ô chia đều, không cuộn; hẹp hơn (VD 375–390pt) → ô giữ 92, tràn sát mép màn hình, hé ô thứ 4 để gợi vuốt, dừng theo từng ô (`snapToInterval`). Nhãn luôn một dòng ("Lịch bàn giao" không bẻ dòng). Đệm dọc 16 để bóng ô không bị cắt. Từ 768 trở lên: lưới 4 cột như cũ.
- 2026-10-05: ô "Yêu cầu" đổi thành **"Bàn giao căn hộ"** (icon `key`, `/ban-giao` — dữ liệu Quỹ bàn giao của web); "Lịch bàn giao" mở màn thật. Hai màn tạm `ComingSoonScreen` đã bỏ. Xem `handover.md`, `handover-schedule.md`.

## Gọn lại (2026-10-05, thay mục "Hàng ô trên điện thoại" ở trên)
- 4 chức năng dùng `QuickActions`: một thẻ chia 4 cột, không cuộn ngang. Nhãn: Hợp đồng · Thanh toán · "Bàn giao\ncăn hộ" · "Lịch\nbàn giao". Bỏ `lib/tileRow` và token `actionTile.minWidth`.
- "Thanh toán sắp tới": mọi đợt quá hạn gom **một dòng đỏ** (`overdueSummary`: "n đợt quá hạn · tổng tiền", "Từ <hạn sớm nhất> · Thanh toán ngay để tránh lãi chậm trả") → bấm mở Thanh toán (đợt quá hạn đứng đầu). Bên dưới `NextPaymentCard` gọn: "Đợt tiếp theo · <tên>", số tiền `title`, badge "Còn n ngày" + "Hạn · Căn · HĐ"; cả thẻ bấm mở hợp đồng (bỏ nút "Xem lịch thanh toán").
- 2026-10-05 (sau): thay dòng tóm tắt quá hạn bằng `OverdueListCard` — MỘT thẻ: đầu nền đỏ nhạt "n đợt quá hạn" + tổng tiền; **3 đợt quá hạn lâu nhất** (`OVERDUE_LIMIT`), mỗi đợt một dòng "tên · Căn · Hạn" | số tiền + "Quá hạn n ngày" (đỏ), bấm mở hợp đồng; còn nhiều hơn → "Xem tất cả n đợt" mở Thanh toán.
- 2026-10-06: banner Trang chủ: "An cư vững tâm" · "Hợp đồng, thanh toán, bàn giao và nhà ở xã hội — tất cả trong một ứng dụng." (nêu đủ các nhóm chức năng hiện có).
- 2026-10-06 (đồng bộ 2 danh sách): **Thanh toán sắp tới** đặt TRƯỚC **Thông báo** (desktop 6/6). Cả hai là MỘT thẻ chứa các `ListRow`:
  - Thanh toán (`UpcomingPaymentsCard`, thay `OverdueListCard` + `NextPaymentCard`): dải đỏ "n đợt quá hạn · tổng" → 3 đợt quá hạn lâu nhất (icon cảnh báo đỏ; "Căn · Quá hạn n ngày" đỏ) → đợt tiếp theo (icon đồng hồ xanh, số tiền xanh; "Căn · Còn n ngày") → "Xem tất cả n đợt quá hạn" nếu còn. Số tiền cùng hàng tên đợt. Không có gì → `EmptyState` trong thẻ.
  - Thông báo: 3 dòng — icon theo loại, tiêu đề 1 dòng, nội dung 2 dòng, thời gian dòng nhỏ cuối, chưa đọc = chấm + nền xanh nhạt.
- 2026-10-06: lưới chức năng **do khách tuỳ chỉnh** (`useHomeModules`, 1–8 mục, mặc định 4 mục bất động sản) — xem `home-modules.md`. Lúc đọc thiết lập hiện Skeleton `card` (không nháy thứ tự mặc định).
- 2026-10-06 (kiểu "Booking gần đây" của beeland-app_2026): **Thanh toán sắp tới** và **Thông báo** là danh sách thẻ rời `ListRow card` (cách nhau `ms`), tiêu đề khối có viên thuốc "Xem tất cả" nền `primary.100` (`Section`).
  - Thanh toán: thẻ đỏ nhạt bo 24 "n đợt quá hạn · tổng ›" (bấm mở Thanh toán) → 3 đợt quá hạn + đợt tiếp theo: icon tròn · tên đợt · "Căn · HĐ" · "Hạn dd/MM/yyyy" | số tiền + `Badge` "Quá hạn n ngày" (đỏ) / "Còn n ngày" (xanh). Bỏ dòng "Xem tất cả n đợt" cuối (đã có ở tiêu đề).
  - Thông báo: icon theo loại · tiêu đề · nội dung 1 dòng · thời gian | `Badge` "Mới" khi chưa đọc. Màn Thông báo dùng cùng kiểu (nội dung 3 dòng).
