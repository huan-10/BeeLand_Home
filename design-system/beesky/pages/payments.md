# Trang: Thanh toán (`app/(app)/payments.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"color contrast text"`, `"text reflow truncation"` (không cắt chữ thiết yếu — cho xuống dòng), `"touch target size"`, `"focus states keyboard"`.

## Khác Master
- **Thanh phân đoạn "Lịch thanh toán | Phiếu thu"** (`PaymentsSegment`, 2026-10-05): phần tử đầu của vùng bám dính, trên `CompactSummary` và hàng chip; chọn "Phiếu thu" → `/receipts` (tab Thanh toán vẫn sáng).
- Tiêu đề "Thanh toán" · phụ đề "Các đợt thanh toán trên tất cả hợp đồng, sắp theo ngày".
- **Cảnh báo quá hạn** (chỉ khi có): khối nền `danger` pastel, `role="alert"`, icon cảnh báo (có nhãn) + chữ "N đợt quá hạn · tổng tiền" + câu nhắc; mỗi đợt quá hạn là một dòng trắng bấm được ("tên đợt · mã HĐ", "Hạn … · Quá hạn N ngày", số tiền, mũi tên) → mở hợp đồng. Màu không phải tín hiệu duy nhất.
- **Thẻ tổng hợp nền ink** (`MoneySummaryCard`, thay 3 thẻ số liệu cũ): "Cần thanh toán · N đợt" `display`, thanh tiến độ "Đã thanh toán X% tổng các đợt" (`summary.paidPercent` tính trong `lib/payment.ts`), hai cột Quá hạn (xanh nhạt khi > 0) · Đã thanh toán. (Bản cũ: `IconCircle md` + "nhãn · N đợt" + số tiền `tabular-nums`.
- **Tab lọc** (`Chip role="tab"`, `chipRow`): **Sắp đến hạn** (mặc định = mọi đợt chưa trả, kể cả quá hạn) · Đã thanh toán · Tất cả.
- **Nhóm theo tháng** ("Tháng 10/2026" `heading` role header + "N đợt · tổng"): chưa trả xếp theo hạn gần nhất trước; đã trả xếp ngày trả mới nhất trước (`lib/payment.ts`: `sortInstallmentsForDisplay`, `groupInstallmentsByMonth`, `overdueInstallments`).

## Bố cục
| | Mobile & tablet (< 1024px) | Desktop (≥ 1024px) |
|---|---|---|
| Thẻ số liệu | 1 cột | 3 cột (span 4) |
| Danh sách đợt | `InstallmentCard` (không cắt chữ: tên đợt, "mã HĐ · căn", ngày đều xuống dòng) | `DataTable`: Đợt thanh toán (tên + mã HĐ · căn) · Hạn / ngày trả (+ "Còn N ngày"/"Quá hạn N ngày") · Số tiền (phải) · Trạng thái (Badge chữ + icon) |

Bấm thẻ / dòng / dòng quá hạn → `/contracts/[id]`.

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | `SkeletonList` 4 thẻ (cảnh báo + thẻ tổng hợp ẩn cho tới khi có dữ liệu) |
| Lỗi | `ErrorState` + "Thử lại" trong `Card` |
| Rỗng | `EmptyState`: "Bạn không có khoản cần thanh toán" / "Chưa có đợt nào được thanh toán" + hành động "Xem phiếu thu" |
| Làm mới | Kéo để làm mới |

> 2026-10-02 — Thanh bám dính: chip lọc (`ChipBar`); cuộn qua thẻ tổng hợp → thêm `CompactSummary` "Cần thanh toán · N đợt" + "Đã trả x%" + thanh tiến độ. Quy tắc chung: MASTER §8 "thanh bám dính".

## Bộ lọc gọn (2026-10-05)
- Thứ tự thanh bám dính: `PaymentsSegment` (Lịch thanh toán | Phiếu thu) → `LineTabs` **Cần thanh toán n | Đã thanh toán n** (bỏ "Tất cả") → `UnitFilterBar` "Tất cả · <mã căn>".
- Chọn căn: thẻ tổng hợp đổi tiêu đề "Thanh toán căn X", số liệu, cảnh báo quá hạn, số đợt trên tab và danh sách đều theo căn đó. Dữ liệu tải một lần, đổi tab / căn không hiện khung tải lại.

## Gộp Lịch thanh toán + Phiếu thu, tối giản (2026-10-05) — thay mục "Bộ lọc gọn" ở trên
- Thứ tự: tiêu đề "Thanh toán" (không phụ đề) → **thẻ thông tin chung nhỏ** (thẻ trắng: Cần thanh toán · số tiền · n đợt | Đã thanh toán · tổng phiếu đã thanh toán (xanh) · n phiếu thu; có đợt quá hạn → một dòng pastel đỏ "n đợt quá hạn · số tiền") → vùng bám dính: `LineTabs` **Cần thanh toán n | Đã thanh toán n** → `UnitFilterBar`.
- Bỏ: thẻ tổng hợp xanh đêm lớn, khối cảnh báo quá hạn liệt kê từng đợt (đợt quá hạn đứng đầu danh sách với nhãn "Quá hạn"), dòng tổng gọn khi cuộn, thanh phân đoạn Lịch thanh toán | Phiếu thu.
- **Cần thanh toán** = đợt chưa trả nhóm theo tháng (hạn gần trước). **Đã thanh toán** = phiếu thu mới nhất trước (`ReceiptList`, bấm mở chi tiết phiếu). Thẻ thông tin chung, số trên tab và hai danh sách đều theo căn đang lọc (`lib/paymentsView.ts`).
- Tab trên URL (`?tab=paid`) để Hồ sơ "Phiếu thu của tôi", liên kết `/receipts` cũ, nút quay lại từ chi tiết phiếu mở thẳng tab Đã thanh toán.
