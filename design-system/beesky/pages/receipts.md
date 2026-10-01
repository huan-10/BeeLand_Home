# Trang: Phiếu thu (`app/(app)/receipts/index.tsx` và `receipts/[id].tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. File này áp dụng cho cả danh sách và chi tiết phiếu thu.

## Khác Master — Danh sách
- Thẻ tổng hợp đầu trang: `IconCircle xl` success + "Tổng đã thu (năm …) · N phiếu" + số tiền `h2` màu `success.700`.
- Chip lọc theo **năm** (Tất cả + các năm có phiếu thu, mới nhất trước).
- Số tiền trong `ReceiptCard` có dấu `+` và màu `success.700`.

## Khác Master — Chi tiết
- Bố cục **"tờ phiếu"**: thẻ duy nhất rộng tối đa `layout.readableMaxWidth` (560), căn giữa ở mọi bề rộng, padding `lg`, `shadows.md`.
- Đầu phiếu: Logo `sm` + badge success "Đã xác nhận" (icon tích); giữa: overline "PHIẾU THU" (`letterSpacing.wide`), số phiếu, số tiền `display` màu `success.700`; đường kẻ **nét đứt** ngăn cách; các `InfoRow`.
- Một nút **secondary** "Xem hợp đồng" (không có nút primary trên màn hình này).

## Bố cục
| | Mobile | Desktop |
|---|---|---|
| Danh sách | 1 cột | 1 cột (thẻ phiếu thu dạng hàng, không chia lưới) |
| Chi tiết | Tờ phiếu toàn chiều rộng | Tờ phiếu 560px căn giữa |

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải (danh sách) | `SkeletonList` 4 thẻ |
| Đang tải (chi tiết) | Skeleton `sizes.skeleton.page` |
| Lỗi | `ErrorState` + Thử lại |
| Rỗng | `EmptyState` "Chưa có phiếu thu" — "Phiếu thu sẽ xuất hiện sau khi khoản thanh toán được xác nhận." |
| Làm mới | Kéo để làm mới (danh sách) |
