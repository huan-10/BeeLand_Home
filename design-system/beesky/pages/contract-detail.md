# Trang: Chi tiết hợp đồng (`app/(app)/contracts/[id].tsx`, đường dẫn rút gọn `/contract/[id]`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"timeline stepper status"` (không khớp → thử lại `"multi-step progress indicator"`: chỉ báo bước/tiến độ rõ ràng), `"sticky bottom action button"` (thanh cố định không được che nội dung), `"modal dialog focus"` (focus ring trong modal, focus không bị che), thêm `"tabs keyboard arrow"` (thứ tự Tab khớp thứ tự hiển thị, không kẹt bàn phím).

## Khác Master
- Header: `ScreenHeader` "Chi tiết hợp đồng" + nút quay lại 44×44. Desktop (≥ 1024px) thêm **Breadcrumb** phía trên: "Hợp đồng › {mã HĐ}" (mục cuối `aria-current="page"`).
- **Một nút primary duy nhất**: "Thanh toán ngay" (chỉ hiện khi còn đợt chưa thanh toán; hợp đồng đã tất toán không có nút).
- Mobile/tablet: nút nằm trong **`StickyActionBar`** dính đáy, phía trên thanh tab kính nổi (chừa chỗ bằng `useFloatingTabBarSpace`; không có tab bar thì tự chừa `insets.bottom`). Thanh đặt **ngoài ScrollView** nên vùng cuộn kết thúc phía trên thanh — không che nội dung/focus.
- Desktop: nút nằm cuối thẻ thông tin bên trái (không sticky).

## Bố cục
| | Mobile & tablet (< 1024px) | Desktop (≥ 1024px) |
|---|---|---|
| Khung | 1 cột cuộn: header → thẻ thông tin → tab → nội dung tab; thanh "Thanh toán ngay" dính đáy | 2 cột, mỗi cột **cuộn riêng** (trái luôn trong tầm nhìn): trái `layout.detailAsideFlex` (5) – thẻ thông tin; phải `layout.detailMainFlex` (7) – tab + nội dung |
| Kéo để làm mới | Có | Không |

## Thẻ thông tin (`ContractSummaryCard`)
**Bản làm mới:** phần đầu tách 2 thẻ — (1) **`MoneySummaryCard` nền xanh đêm (ink)**: mã HĐ `heading` trắng (chọn được) + loại HĐ + Badge trạng thái + tên dự án, "Giá trị hợp đồng" `display`, thanh tiến độ + chữ %, Đã thanh toán / Còn phải thanh toán (xanh nhạt), desktop: nút "Thanh toán ngay" ở footer; (2) thẻ trắng: ảnh dự án (cắt bo góc trên ở lớp riêng), Căn · Tầng, ngày ký, `KeyValueRow` **Mã hợp đồng (chạm để sao chép)**, link PDF. Trước đây: ảnh dự án (`ProjectImage`) · mã HĐ `title` (xuống dòng, chọn được) + loại HĐ · Badge trạng thái `md` · tên dự án · Căn · Tòa · Tầng · Ngày ký · Giá trị hợp đồng · Đã thanh toán "số tiền (%)" (`textBrand`, `textSuccess` khi 100%) · **Còn phải thanh toán** · `ProgressBar` (xanh trời / xanh lá khi 100%) · hàng **"Xem hợp đồng (PDF)"** (`role="link"`, nền `primary.50`, icon tài liệu + icon mở ngoài).
- PDF: `services` trả `document.url` (mock: `assets/docs/hop-dong-mau.pdf`); `lib/openDocument` mở bằng tab mới (web), trình xem hệ thống qua `expo-sharing` (tệp cục bộ, native) hoặc `expo-web-browser` (URL http).

## Tab (`Tabs` + `TabPanel`)
- 3 tab: **Lịch thanh toán** · **Phiếu thu (n)** · **Thông tin khác**; kiểu **thanh phân đoạn** (`Tabs`): tab đang chọn là viên trắng nổi trên nền cát, chữ `textBrand` đậm.
- Trợ năng: `role="tablist"` / `role="tab"` + `aria-selected`; panel `role="tabpanel"` + `aria-labelledby`, `tabIndex=0`. Web: roving tabindex (chỉ tab đang chọn nhận Tab), **←/→** chuyển tab (vòng), **Home/End** về đầu/cuối, focus đi theo tab.

### Lịch thanh toán (`InstallmentTimeline`)
| Trạng thái | Nút tròn | Badge (chữ + icon) |
|-----------|----------|--------------------|
| Đã thanh toán | Xanh lá đặc + **dấu tick** | "Đã thanh toán" ✓ |
| Đến hạn (≤ 30 ngày) / một phần | **Xanh trời** đặc + icon đồng hồ báo thức / đồng hồ cát | "Đến hạn" / "Thanh toán một phần" |
| Chưa đến hạn | **Xám** viền + icon đồng hồ | "Chưa đến hạn" |
| Quá hạn | Đỏ đặc + icon cảnh báo (Master: `danger`) | "Quá hạn" |

Mỗi đợt: tên, số tiền `heading`, "% giá trị HĐ · ngày thanh toán/hạn + số ngày còn lại"; mỗi dòng có tên truy cập đầy đủ (tên, số tiền, ngày, trạng thái). Đường nối tô xanh giữa các đợt đã thanh toán.

### Phiếu thu
Danh sách `ReceiptCard` của hợp đồng (`useReceipts({ contractId })`) → bấm mở chi tiết phiếu thu. Đang tải: 2 Skeleton `row`; rỗng: `EmptyState` "Chưa có phiếu thu"; lỗi: `ErrorState` + Thử lại.

### Thông tin khác
3 thẻ: **Bên bán** (công ty, người đại diện – chức vụ, MST, địa chỉ, hotline, email — MST / hotline / email **chạm để sao chép**) · **Điều khoản chính** (tiêu đề semibold + nội dung, theo loại HĐ) · **Thông tin căn hộ** (loại HĐ, diện tích, chuyên viên tư vấn). Dữ liệu mock trong `data/mock/contractDetails.ts`, lấy qua `getContractById`.

## Hộp thoại xác nhận thanh toán (`PaymentConfirmDialog` dựa trên `Dialog`)
- Nội dung: hộp **nền ink** bo 20 "Số tiền cần thanh toán" (`title` trắng, `numeric`) + "Còn N ngày"/"Quá hạn N ngày"; `KeyValueRow` Hợp đồng · Đợt · Căn hộ · Hạn thanh toán. Khoản được chọn = `summary.nextInstallment` (đợt quá hạn trước, sau đó hạn gần nhất).
- Nút: "Hủy" (ghost) · "Xác nhận thanh toán" (primary, `loading`).
- **Esc** / nút X / chạm vùng tối / Back (Android) đều đóng; web: focus **giữ trong hộp thoại**, focus đầu tiên vào nút Đóng, đóng xong **trả focus về "Thanh toán ngay"**; tắt hiệu ứng khi giảm chuyển động.
- Xác nhận → `startPayment(contractId, installmentId)` (`services/paymentService.ts`, **TODO** tích hợp cổng thanh toán). Kết quả `unavailable` → Toast thông tin; `redirect` → mở `checkoutUrl`; lỗi → Toast `danger`.

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang tải | Header + Skeleton `block` · `control.md` · `block` |
| Không tìm thấy / lỗi | Header + `ErrorState` "Không tìm thấy hợp đồng." + Thử lại |
| Đã tất toán | Không có nút "Thanh toán ngay"; thanh tiến độ xanh lá |

> 2026-10-02: thẻ dùng **ảnh thật của dự án** + lớp phủ, tên dự án / căn đè ảnh; thẻ danh sách có khối tiến độ và "đợt tiếp theo". Chi tiết: `docs/real-data.md` mục Giao diện thẻ hợp đồng.

> 2026-10-02 — Mobile: thanh tab bám dính; cuộn qua thẻ tổng → `CompactSummary` "mã HĐ · dự án", "Còn …", "Đã trả x%". Quy tắc chung: MASTER §8 "thanh bám dính".

## Tối giản (2026-10-05) — thay các mục "Thẻ thông tin", "Tab" và thanh dính đáy ở trên
- **Một thẻ thông tin** (`ContractSummaryCard`), mỗi thông tin xuất hiện một lần: ảnh dự án `sizes.roundImage` (loại HĐ viên kính + badge trạng thái ở trên, tên dự án + căn ở dưới — như thẻ danh sách) → khối tiền nền `surfaceMuted` (Giá trị hợp đồng `title`, thanh tiến độ, "Đã trả · x%" | "Còn lại" xanh) → `KeyValueRow` Mã hợp đồng (chạm để sao chép) + Ngày ký → link PDF → (desktop) nút "Thanh toán ngay". Bỏ thẻ xanh đêm lớn: mã HĐ dài không còn bị bẻ dòng cạnh badge, tên dự án / mã HĐ không lặp hai lần.
- **Tab gạch chân** `LineTabs` (cùng kiểu màn Thanh toán): Lịch thanh toán · Phiếu thu n · Thông tin; rộng theo nội dung để nhãn không bị cắt; `id` nối với `TabPanel`. Bỏ dòng tổng gọn khi cuộn — thanh bám dính chỉ còn tab.
- **Thanh đáy mobile**: trái tên đợt cần trả, số tiền còn phải trả (đậm), "Còn n ngày" / "Quá hạn n ngày" (đỏ); phải nút "Thanh toán". Khách thấy trả khoản nào, bao nhiêu trước khi bấm. Không còn đợt cần trả → không có thanh.
