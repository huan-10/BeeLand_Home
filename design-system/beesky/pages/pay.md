# Trang: Thanh toán QR (`app/(app)/pay.tsx`, `/pay?contractId=&dot=&code=`)

> Chỉ ghi điểm **khác** `MASTER.md`. Mở từ "Xác nhận thanh toán" ở Chi tiết hợp đồng (`pages/contract-detail.md`). Tra skill (`--domain ux`): `"payment confirmation feedback"` (báo rõ đang chờ / đã nhận), `"loading state"` (khung giữ chỗ), `"copy to clipboard feedback"` (toast sau sao chép).

## Bố cục
- Một cột `layout.readableMaxWidth` (560) căn giữa ở mọi bề rộng; `ScreenHeader` "Thanh toán" + mã HĐ (phụ đề) + nút quay lại.
- Khối **xanh đêm** (giống hộp xác nhận): "Số tiền cần chuyển · {khoản}", số tiền `title` trắng chọn được; giữ chỗ thêm Badge `warning` "Mã còn hiệu lực mm:ss" (đếm từng giây).
- Thẻ trắng: ảnh VietQR `sizes.qrCode` (232) trong khung trắng viền mảnh (giữ tương phản khi quét) → chú thích → hàng **"Mở app ngân hàng để thanh toán"** (`components/domain/BankApps.tsx`, xem mục dưới) → dòng "Đang chờ nhận tiền…" (spinner, `accessibilityLiveRegion="polite"`) → 2 nút outline ngang nhau "Lưu mã QR" · "Sao chép".
- Thẻ "Hoặc chuyển khoản thủ công": `KeyValueRow` Ngân hàng · Số tài khoản (sao chép) · Chủ tài khoản · Số tiền (số thô, sao chép) · Nội dung (sao chép).
- Ghi chú `caption` theo loại: giữ chỗ (mã hết hạn cùng thời gian giữ chỗ, tự duyệt), đặt cọc (đủ tiền cọc tự duyệt), đợt HĐMB (tài khoản riêng của hợp đồng).

## Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Đang tạo mã | Thẻ: Skeleton vuông `qrCode` + "Đang tạo mã thanh toán…" |
| Lỗi (máy chủ từ chối / chưa bật) | `ErrorState` "Chưa tạo được mã thanh toán" + thông điệp máy chủ + Thử lại |
| Bị chặn theo nghiệp vụ (edge trả `code`) | `StateView` (không "Thử lại") + nút "Về hợp đồng": `NO_PAYMENT_ACCOUNT` icon `info` "Chưa hỗ trợ thanh toán trực tuyến" (dự án chưa có tài khoản nhận tiền); `WAIT_FOR_STAFF` icon `hourglass` warning "Đang chờ tạo tài khoản thanh toán" (nhiều tài khoản cấu hình, ban quản lý tạo) — mô tả = thông điệp máy chủ |
| Đã nhận tiền | `StateView` success `checkCircle` "Đã nhận thanh toán" (+ "đã duyệt tự động" khi booking/cọc được duyệt), nút "Về hợp đồng"; xoá dữ liệu đệm để phiếu thu hiện ngay |
| Hết hạn / VA bị xoá | `StateView` warning `hourglass` "Mã thanh toán đã hết hạn", nút "Về hợp đồng" |

## Hành vi
- Hỏi trạng thái mỗi **5 giây chỉ khi màn đang hiển thị** (rời màn thì dừng); quay lại màn sau khi xong / lỗi / hết hạn → tạo lại mã.
- "Lưu mã QR": native tải ảnh về bộ đệm → bảng chia sẻ ("Lưu hình ảnh"); web tải tệp `QR-<mã HĐ>.png` (bị chặn thì mở tab mới).
- **Quay lại** (nút trên màn + Back Android, `hooks/useHardwareBack`): luôn về **đúng hợp đồng** (`router.navigate('/contracts/[id]')`), không dùng `router.back()` — màn này là tab ẩn, `back()` của thanh tab rơi về Trang chủ. Đã nhận tiền → kèm `paidAt` để chi tiết hợp đồng tải lại lịch + phiếu thu.
- Chi tiết hợp đồng cũng vậy: chỉ lùi trong Stack nhánh Hợp đồng; không còn màn dưới → `router.replace('/contracts')`.

## Mở app ngân hàng điền sẵn (VietQR deeplink)
- Hàng logo app ngân hàng (chỉ logo, `sizes.bankAppLogo` 46, bo `radius.md`, viền mảnh) dưới chú thích QR: bấm 1 chạm → `https://dl.vietqr.io/pay?...` (trang VietQR ~1 giây) → app ngân hàng mở màn chuyển tiền đã điền **STK định danh · ngân hàng · số tiền · nội dung** y như mã QR. Logic: `lib/bankApps.ts` (test `tests/bank-apps.test.cjs`).
- Chỉ app `autofill = 1` của VietQR: MB, VietinBank, BIDV, OCB, ACB. App dùng lần trước lên đầu, viền `semantic.action` + dấu tick (AsyncStorage `@bank_deeplink`).
- Mã còn hiệu lực = 0 → hàng mờ `opacity.disabled`, không bấm được. `bank_code` không nhận ra (không phải mã / tên ngắn / BIN VietQR) → ẩn cả hàng. Web → ẩn (máy tính không có app ngân hàng).
- Mở lỗi → toast danger "Không mở được app ngân hàng". Máy chưa cài app → trang VietQR tự báo.
- `url` quay về = `https://beesky.vn` (bắt buộc https — scheme riêng thì VietQR không tự điền). Việc mở link này sau khi chuyển do app ngân hàng quyết định.
- Giới hạn VietQR: 5 lượt tự điền / phút / IP — thử dồn dập dễ bị chặn tạm. Kiểm link: `curl` với UA iPhone, trang có `"ticket"` là tự điền được.
