# Trang: Danh sách hợp đồng (`app/(app)/contracts/index.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`.

## Khác Master
- Thanh **tìm kiếm** (`Input` có icon kính lúp, debounce 300ms) + **hàng chip lọc trạng thái** cuộn ngang (Tất cả · Đang hiệu lực · Chờ xử lý · Đã hoàn tất). Cuộn ngang chỉ trong hàng chip — ngoại lệ có chủ đích của "không cuộn ngang".
- Thứ tự thẻ: HĐMB → HĐĐC → PGC, rồi ngày ký mới nhất (do `services/` quyết định, không sắp xếp trong màn hình).

## Bố cục
| | Mobile | Desktop |
|---|---|---|
| Danh sách | 1 cột | Lưới 2 cột |
| Tìm kiếm + chip | Xếp dọc, chip cuộn ngang | Như mobile (chip thường vừa một hàng) |

## Thành phần chính
`ScreenHeader` ("Hợp đồng" + phụ đề), `Input` tìm kiếm, `Chip`, `ContractCard` (icon loại HĐ, mã HĐ, badge trạng thái có chấm, dự án · căn, giá trị `h3`, % cam, `ProgressBar` — đỏ nếu có đợt quá hạn, "x/y đợt").

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | `SkeletonList` 3 thẻ |
| Lỗi | `ErrorState` + Thử lại |
| Không có kết quả | `EmptyState` "Không tìm thấy hợp đồng"; mô tả khác nhau khi đang tìm / đang lọc; nút "Xóa bộ lọc" |
| Làm mới | Kéo để làm mới |
