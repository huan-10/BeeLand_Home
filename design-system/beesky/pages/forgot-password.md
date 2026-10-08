# Trang: Quên mật khẩu (`app/forgot-password.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Khung, ảnh nền, bố cục mobile/desktop **giống `login.md`**. Phần nhập OTP giống bước 2 của `register.md`.

## Luồng 3 bước (OTP thật, 2026-10-08 — `fn_portal_app_otp_gui` / `fn_portal_app_otp_xac_minh`)
1. **SĐT** — tiêu đề "Quên mật khẩu", phụ đề "Nhập số điện thoại đã đăng ký, chúng tôi sẽ gửi mã xác nhận qua Zalo."; một ô "Số điện thoại" (`phone-pad`, `autoComplete="tel"`, Enter gửi); nút primary `lg` "Gửi mã xác nhận" (`startPasswordReset`).
   - Lỗi server hiện dưới ô + focus. SĐT chưa có tài khoản ("Số điện thoại chưa đăng ký tài khoản.") → thêm dòng "Chưa có tài khoản?" + `TextLink` "Đăng ký" (thay màn bằng `/register`).
2. **Mã + mật khẩu mới** — tiêu đề "Đặt lại mật khẩu", phụ đề "Nhập mã N số đã gửi qua Zalo tới {SĐT}."; 3 ô: "Mã OTP" (`number-pad`, `one-time-code`, `maxLength` = độ dài mã), "Mật khẩu mới" (gợi ý "Tối thiểu 6 ký tự"), "Nhập lại mật khẩu"; nút primary `lg` "Đặt lại mật khẩu" (`confirmPasswordReset`); hàng dưới: "Gửi lại mã sau N giây" → `TextLink` "Gửi lại mã" · `TextLink` "Đổi số điện thoại" (bỏ mã đang chờ).
   - Kiểm tra ở máy (`validateResetForm`): mã đủ N số, mật khẩu 6–72 ký tự, nhập lại khớp. Lỗi server (sai / hết hạn / huỷ mã → ô OTP; độ dài mật khẩu → ô mật khẩu) hiện dưới ô tương ứng + focus.
3. **Xong** — `StateView` tông `success`, icon `checkCircle`, `role="alert"`: "Đã đặt lại mật khẩu" / "Bạn có thể đăng nhập bằng mật khẩu mới."; nút primary "Đăng nhập" → màn Đăng nhập điền sẵn SĐT.

Footer mọi bước: "Nhớ mật khẩu rồi?" + `TextLink` "Đăng nhập". Không có `FormErrorSummary`.

Mật khẩu mới áp cho tài khoản ở **mọi công ty** có SĐT này; tài khoản bị khoá do nhập sai được mở và mọi phiên cũ bị đăng xuất. Màn **báo rõ** SĐT chưa đăng ký (người dùng chốt 2026-10-08 — đăng ký vốn đã báo rõ nên không giấu ở đây).
