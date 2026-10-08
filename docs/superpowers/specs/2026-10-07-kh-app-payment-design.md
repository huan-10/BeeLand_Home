# Thanh toán QR trong app khách hàng — thiết kế (2026-10-07)

**Mục tiêu:** khách bấm "Thanh toán" trong app → chuyển khoản bằng mã QR vào tài khoản định danh (VA), cùng luồng web đã có cho booking / đặt cọc (`beeland/docs/payment-flow.md`, `BookingVAQRDialog` + edge `payment-gateway`). Tiền về → webhook có sẵn tạo phiếu thu (+ tự duyệt booking / đặt cọc).

**Ràng buộc (người dùng):** dùng edge mới theo phiên khách; được sửa server cho việc này nhưng **không ảnh hưởng web** → chỉ thêm hàm / edge mới, không sửa `payment-gateway`, webhook, hàm web dùng.

## Máy chủ
- `supabase/migrations/20261009160100_portal_payment.sql`
  - `fn_portal_payment_target(token, pgc, dot)` (chỉ `service_role`): phiếu phải của khách trong phiên; tính module / số tiền / hạn (bảng ở `docs/real-data.md`).
  - `fn_portal_payment_status(token, va_id)` (anon): `paid_amount`, `status`, `approved`.
- Edge `portal-payment` `start`: dùng lại VA đang hoạt động; chưa có → **chỉ tự tạo khi dự án có đúng 1 tài khoản cấu hình** (loại thu "Thu theo tiến độ"; đặt cọc "Thu tiền cọc"; số tiền tạo HĐ = giá trị HĐ như web), nhiều/không có → chặn, chờ ban quản lý tạo trên web (chốt 2026-10-07). Log như `payment-gateway`, tối đa 5 VA / phiếu / 24 giờ. App **không gửi số tiền**.

## App
`lib/paymentTarget` (khoản trả được, VietQR, đếm ngược) → `ContractDetail.payTarget` → `PaymentConfirmDialog` → màn `/pay` (`usePaymentCheckout`: start → QR → hỏi trạng thái 5 giây khi màn hiển thị). Mock: VA giả, "nhận tiền" sau 20 giây.

## Kiểm thử
`tests/payment-target.test.cjs`; SQL thử trong `BEGIN…ROLLBACK` (số tiền khớp app, chặn phiếu khách khác / token giả). Không tạo VA thật — bước thử cuối do người dùng bấm trên app sau khi triển khai (`scripts/deploy-portal-payment.sh`).
