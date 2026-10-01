# Trang: Thanh toán (`app/(app)/payments.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"color contrast text"`, `"text reflow truncation"` (không cắt chữ thiết yếu — cho xuống dòng), `"touch target size"`, `"focus states keyboard"`.

## Khác Master
- Tiêu đề "Thanh toán" · phụ đề "Các đợt thanh toán trên tất cả hợp đồng, sắp theo ngày".
- **Cảnh báo quá hạn** (chỉ khi có): khối nền `danger` pastel, `role="alert"`, icon cảnh báo (có nhãn) + chữ "N đợt quá hạn · tổng tiền" + câu nhắc; mỗi đợt quá hạn là một dòng trắng bấm được ("tên đợt · mã HĐ", "Hạn … · Quá hạn N ngày", số tiền, mũi tên) → mở hợp đồng. Màu không phải tín hiệu duy nhất.
- **Thẻ tổng hợp nền ink** (`MoneySummaryCard`, thay 3 thẻ số liệu cũ): "Cần thanh toán · N đợt" `display`, thanh tiến độ "Đã thanh toán X% tổng các đợt" (`summary.paidPercent` tính trong `lib/payment.ts`), hai cột Quá hạn (mật ong khi > 0) · Đã thanh toán. (Bản cũ: `IconCircle md` + "nhãn · N đợt" + số tiền `tabular-nums`.
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
