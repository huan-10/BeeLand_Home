# Trang: Thanh toán (`app/(app)/payments.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`.

## Khác Master
- **3 thẻ thống kê** đầu trang (`IconCircle md` + nhãn · số đợt + số tiền đậm): Cần thanh toán (primary), Quá hạn (danger), Đã thanh toán (success).
- Chip lọc mặc định là **"Cần thanh toán"** (không phải "Tất cả"): Cần thanh toán · Đã thanh toán · Tất cả.
- Danh sách gộp mọi hợp đồng nên `InstallmentCard` hiển thị thêm dòng "mã HĐ · Căn".
- Thứ tự: chưa thanh toán theo hạn gần nhất trước, sau đó đã thanh toán mới nhất trước (do `lib/payment.ts`).

## Bố cục
| | Mobile | Desktop |
|---|---|---|
| Thẻ thống kê | Xếp dọc 3 thẻ | 1 hàng 3 cột |
| Danh sách đợt | 1 cột | 1 cột |

## Thành phần chính
`InstallmentCard`: hàng trên (ô icon trạng thái, tên đợt, mã HĐ · căn, số tiền đậm bên phải) + hàng dưới có đường kẻ (ngày hạn / ngày đã trả + "Còn N ngày" hoặc "Quá hạn N ngày" màu đỏ, badge trạng thái). Bấm → chi tiết hợp đồng.

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | `SkeletonList` 4 thẻ (thẻ thống kê ẩn cho tới khi có dữ liệu) |
| Lỗi | `ErrorState` + Thử lại |
| Rỗng — Cần thanh toán | `EmptyState` "Bạn không có khoản cần thanh toán" |
| Rỗng — Đã thanh toán | `EmptyState` "Chưa có đợt nào được thanh toán" |
| Làm mới | Kéo để làm mới |
