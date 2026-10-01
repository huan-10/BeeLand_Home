# Trang: Phiếu thu (`app/(app)/receipts/index.tsx` và `receipts/[id].tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"data table responsive"` (bảng không được tràn trên mobile → dùng dạng thẻ; không cuộn ngang), `"empty state"` (luôn có lời giải thích + hành động).

## Trạng thái phiếu thu (`receiptStatusMeta`)
| Trạng thái | Badge (chữ + icon) | Tông | Số tiền |
|-----------|--------------------|------|---------|
| `paid` | "Đã thanh toán" ✓ | success | `textSuccess` |
| `pending` | "Chờ xác nhận" đồng hồ | warning | `text` |
| `cancelled` | "Đã hủy" ⊗ | neutral | `textMuted` + gạch ngang |

"Tổng đã thanh toán" chỉ cộng phiếu `paid` (`sumPaidReceipts`).

## Danh sách
- `ScreenHeader` "Phiếu thu" · thẻ tổng "Tổng đã thanh toán · N phiếu" (`IconCircle xl` success, số tiền `title` `textSuccess`).
- **Tab lọc** (`Chip role="tab"`, `chipRow` xuống dòng): **Tất cả (n)** · **Đã thanh toán (n)** · **Theo hợp đồng (n hợp đồng)**; tên truy cập "Đã thanh toán, 6 phiếu thu". Lọc / nhóm / đếm trong `lib/receipt.ts`, dữ liệu qua `useReceiptList(tab)`.
- **Theo hợp đồng**: mỗi nhóm có tiêu đề (icon tài liệu, mã HĐ `heading` role header, "dự án · căn · n phiếu", "Đã thanh toán" tổng nhóm bên phải) rồi danh sách/bảng phiếu của nhóm. Nhóm có phiếu mới nhất đứng trước.

### Bố cục
| | Mobile & tablet (< 1024px) | Desktop (≥ 1024px) |
|---|---|---|
| Dòng phiếu thu | **Thẻ** `ReceiptCard`: `IconCircle` tài liệu (tông theo trạng thái) · mã phiếu semibold · "ngày · mã HĐ" · số tiền (phải) · Badge trạng thái | **Bảng** `DataTable` |
| Bảng | — | Cột: **Mã phiếu** (icon tài liệu + mã) · **Ngày thu** · **Hợp đồng** · **Số tiền** (căn phải, `tabular-nums`) · **Trạng thái** (Badge). `role="table"` → `row` → `columnheader` / `cell`; tiêu đề cột `overline` `textMuted` trên nền `surfaceMuted`. Dòng: hover nền `primary.50` + pointer, focus bằng Tab, **Enter** mở chi tiết |

Bấm thẻ / dòng → `/receipts/[id]`.

### Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | Desktop: thẻ chứa 4 Skeleton dòng; mobile: 4 `ReceiptCardSkeleton` |
| Lỗi | `ErrorState` + "Thử lại" trong `Card` |
| Rỗng | `EmptyState` "Chưa có phiếu thu" / "Chưa có phiếu thu đã thanh toán" + hành động: "Xem tất cả phiếu thu" (đang lọc) hoặc "Xem lịch thanh toán" (tab Tất cả) |
| Làm mới | Kéo để làm mới |

## Chi tiết
- Bố cục **"tờ phiếu"**: thẻ duy nhất tối đa `layout.readableMaxWidth` (560), căn giữa, padding `lg`, `shadows.raised`.
- Đầu phiếu: Logo `sm` + **Badge trạng thái thật** (`receiptStatusMeta`, size `md`); giữa: label "PHIẾU THU", số phiếu, số tiền `display` (màu theo trạng thái, gạch ngang khi đã hủy).
- Phiếu `pending` / `cancelled`: hộp thông báo pastel theo tông (`role="status"`) giải thích trạng thái.
- Thẻ phiếu bo 28 (`radius="3xl"`, `raised`). Đường kẻ nét đứt + `KeyValueRow`: **Số phiếu** (sao chép), Ngày thu, Người nộp, Hợp đồng (sao chép), Dự án / Căn, Hình thức, Mã giao dịch (sao chép), Thu ngân, Nội dung.
- Hành động: **"Tải PDF"** (secondary, `download-outline`) và **"Chia sẻ"** (outline, `share-social-outline`) chia đôi một hàng, có `loading`. Gọi `exportReceiptPdf` / `shareReceipt` (`services/receiptService.ts`, **TODO** xuất file) → hiện trả `unavailable` → Toast "… sắp ra mắt"; khi có `url` sẽ mở bằng `openDocument`. Dưới cùng: `TextLink` "Xem hợp đồng {mã}".
- Không có nút primary trên màn chi tiết phiếu thu.
