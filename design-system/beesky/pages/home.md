# Trang: Trang chủ (`app/(app)/index.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`.

## Khác Master
- Không dùng `ScreenHeader`; thay bằng **lời chào**: "Xin chào," (`small`, `textMuted`) + tên (`h2`), avatar `md` bên trái (chỉ mobile — desktop đã có thẻ người dùng ở sidebar), `IconButton` chuông thông báo có số đếm chưa đọc bên phải.
- Đây là màn hình duy nhất có **thẻ tổng quan gradient** cho toàn bộ hợp đồng.
- Thẻ cảnh báo quá hạn dùng nền `danger` pastel thay vì thẻ trắng.

## Bố cục
| Khối | Mobile | Desktop |
|------|--------|---------|
| Tổng quan + Đợt tiếp theo | Xếp dọc | 2 cột ngang nhau (`ResponsiveGrid columns=2`) |
| Cảnh báo quá hạn | Toàn chiều rộng | Toàn chiều rộng |
| Lối tắt (4 ô: Hợp đồng, Lịch thanh toán, Phiếu thu, Thông báo) | 4 ô 1 hàng, nhãn tối đa 2 dòng | 4 ô 1 hàng |
| Hợp đồng của tôi | 2 thẻ, 1 cột | 4 thẻ, lưới 2 cột |
| Thông báo mới | 3 mục mới nhất | 3 mục mới nhất |

## Thành phần chính
`PaymentOverviewCard`, `NextPaymentCard` (badge "Còn N ngày", nút secondary "Xem lịch thanh toán"), thẻ quá hạn, lối tắt `IconCircle md`, `ContractCard`, `NotificationItem`, `Section` có link "Xem tất cả".

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | Skeleton `sizes.skeleton.hero` + `card`; danh sách hợp đồng `SkeletonList` |
| Lỗi tổng quan | `ErrorState` + Thử lại thay cho khối tổng quan |
| Không có khoản sắp đến hạn | Thẻ chứa `EmptyState` "Không có khoản sắp đến hạn" |
| Không có hợp đồng | `EmptyState` "Chưa có hợp đồng" |
| Không có thông báo | Ẩn section Thông báo mới |
| Làm mới | Kéo để làm mới cả tổng quan và hợp đồng |
