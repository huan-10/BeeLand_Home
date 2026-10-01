# Trang: Chi tiết hợp đồng (`app/(app)/contracts/[id].tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`.

## Khác Master
- `ScreenHeader` có **nút quay lại**; tiêu đề là mã hợp đồng, phụ đề là loại hợp đồng. Nếu mở trực tiếp bằng URL (không có lịch sử) → quay lại `/contracts`.
- Dùng **thẻ tổng quan gradient** cho riêng hợp đồng ("Giá trị hợp đồng").
- **Timeline lịch thanh toán** đặt trong `Card` padding `ml` — thành phần trọng tâm của màn hình.

## Bố cục
| | Mobile | Desktop |
|---|---|---|
| Thứ tự | Tổng quan → Thông tin căn → Lịch thanh toán → Phiếu thu liên quan | 2 cột: trái (Tổng quan, Thông tin căn, Phiếu thu) · phải (Lịch thanh toán), căn đỉnh |

## Thành phần chính
- Thẻ thông tin: `IconCircle xl` + tên dự án `h3` + tháp · căn; `InfoRow`: Loại HĐ, Trạng thái (Badge), Ngày ký, Tầng, Diện tích (m², dấu phẩy thập phân), Chuyên viên tư vấn.
- `InstallmentTimeline`: tiêu đề section "Lịch thanh toán (đã trả/tổng đợt)".
- Danh sách `ReceiptCard` liên quan → mở chi tiết phiếu thu.

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | Header + Skeleton `card`, `hero`, `block` |
| Không tìm thấy / lỗi | Header + `ErrorState` ("Không tìm thấy hợp đồng.") + Thử lại |
| Chưa có lịch | `EmptyState` "Chưa có lịch thanh toán" trong thẻ |
| Chưa có phiếu thu | Thẻ với dòng chữ `textMuted` căn giữa |
| Phiếu thu đang tải | Skeleton `row` |
