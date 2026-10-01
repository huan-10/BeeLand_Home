# Trang: Hợp đồng của tôi (`app/(app)/contracts/index.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill: `"filter tabs list" --domain ux` (tab/chip lọc **xuống dòng** khi thiếu chỗ, không cắt và không ẩn), `"badge chip label wraps" --domain ux` (badge giữ một dòng, phần tử bên cạnh co lại; không cắt nhãn), `"progress indicator" --domain ux` (tiến độ bằng thanh, có nhãn).

## Khác Master
- Tiêu đề "Hợp đồng của tôi" + phụ đề.
- Ô tìm kiếm có **nhãn hiển thị** "Tìm theo mã hợp đồng" (placeholder chỉ là ví dụ "VD: HDMB/2026/001"), debounce 300ms. So khớp mã bỏ qua hoa/thường, khoảng trắng, "/" và "-" (`lib/contract.ts` → `matchesContractCode`).
- **Tab lọc** (`Chip role="tab"` trong `role="tablist"`, xuống dòng khi hẹp): Tất cả (n) · Đang hiệu lực (n) · Đã tất toán (n). Số lượng tính theo cùng từ khóa tìm kiếm (`getContractCounts(search)` → `countContractsByStatus`). Tên truy cập: "Đang hiệu lực, 2 hợp đồng".
- Thứ tự thẻ: HĐMB → HĐĐC → PGC, rồi ngày ký mới nhất (do `services/`).

## Thẻ hợp đồng (`ContractCard`)
| Phần | Quy định |
|------|----------|
| Ảnh dự án | `ProjectImage` cao `sizes.projectImage` (148), `cover`; không có `projectImageUrl` hoặc tải lỗi → `assets/images/project-placeholder.jpg` |
| Mã hợp đồng | `heading`, **xuống dòng đầy đủ** (không `numberOfLines`), chọn/copy được; loại HĐ `caption` bên dưới |
| Badge trạng thái | Bên phải mã, có chấm + **chữ** ("Đang hiệu lực", "Đã tất toán", "Chờ xử lý"); không co lại (`flexShrink: 0`) |
| Tên dự án | `bodyStrong` semibold, **xuống dòng đầy đủ** |
| Căn hộ · Tòa / Ngày ký | Icon outline `sm` + `caption` `textSecondary` |
| Giá trị / Đã thanh toán | Hàng nhãn – số tiền (đậm), "Đã thanh toán 1.250.000.000 đ (50%)": % màu `textBrand`, hoặc `textSuccess` khi 100% |
| Thanh tiến độ | `ProgressBar` **cam** (`primary`) khi < 100%, **xanh lá** (`success`) khi 100% (`isFullyPaid`); nhãn "Tiến độ thanh toán 100%, đã tất toán" |
| Tương tác | Cả thẻ là nút → `/contracts/[id]` (đường dẫn rút gọn `/contract/[id]` chuyển hướng về đây). Web: hover **nâng nhẹ** (`Card hoverLift`: dịch lên 4px + `shadows.raised`), con trỏ pointer, focus ring; nhấn: opacity |

## Bố cục (`Grid`/`Col`)
| Bề rộng | Cột thẻ |
|---------|---------|
| < 1024px (mobile, tablet có sidebar) | 1 cột |
| 1024–1279px | 2 cột (span 6) |
| ≥ 1280px | 3 cột (span 4) |

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | 3 `ContractCardSkeleton` (cùng kích thước thẻ thật); tab vẫn hiện, giữ số lượng cũ nếu có |
| Lỗi | `ErrorState` + "Thử lại" trong `Card` |
| Không có kết quả | `EmptyState` "Không tìm thấy hợp đồng": khi tìm kiếm → nêu mã đã nhập; khi lọc → "Chưa có hợp đồng nào trong mục này."; nút "Xóa bộ lọc" khi đang lọc/tìm |
| Làm mới | Kéo để làm mới |
