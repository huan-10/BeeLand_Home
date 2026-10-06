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
| Thanh tiến độ | `ProgressBar` **xanh trời** (`primary`) khi < 100%, **xanh lá** (`success`) khi 100% (`isFullyPaid`); nhãn "Tiến độ thanh toán 100%, đã tất toán" |
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

> 2026-10-02: thẻ dùng **ảnh thật của dự án** + lớp phủ, tên dự án / căn đè ảnh; thẻ danh sách có khối tiến độ và "đợt tiếp theo". Chi tiết: `docs/real-data.md` mục Giao diện thẻ hợp đồng.

> 2026-10-02 — Thanh bám dính: ô tìm (mã HĐ, mã căn, tên dự án — không phân biệt dấu) + `ChipBar`; cuộn qua tiêu đề → `CompactSummary` "N hợp đồng · tổng giá trị", "Đã trả …", %. Quy tắc chung: MASTER §8 "thanh bám dính".

## Bộ lọc gọn (2026-10-05)
- Bỏ 3 chip trạng thái (Tất cả / Đang hiệu lực / Đã tất toán) — trạng thái đã có nhãn trên từng thẻ. Thanh bám dính còn: ô tìm + `UnitFilterBar` "Tất cả · <mã căn>" (chip gọn 36, lọc trên máy, căn lấy từ kết quả tìm). Khách 1 căn → không hiện hàng chip.
- Không có kết quả khi chọn căn → "Căn X chưa có hợp đồng." + "Xóa bộ lọc" (xoá cả tìm kiếm và căn).
