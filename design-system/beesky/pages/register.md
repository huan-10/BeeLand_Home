# Trang: Đăng ký (`app/register.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Khung, ảnh nền, bố cục mobile/desktop và hành vi bàn phím **giống `login.md`**.

## Khác Đăng nhập
- Tiêu đề "Tạo tài khoản", phụ đề "Dùng số điện thoại đã đăng ký khi ký hợp đồng…"; footer "Đã có tài khoản?" + `TextLink` "Đăng nhập" (quay lại).
- Không có nút Google/Apple, không có hộp tài khoản demo.
- Mobile: Enter chuyển lần lượt qua các ô; Enter ở ô cuối gửi form. Web: Enter ở ô cuối gửi form.

## Thành phần chính (thứ tự Tab)
| Ô | Thuộc tính |
|---|-----------|
| Số điện thoại | icon điện thoại, `keyboardType="phone-pad"`, `autoComplete="tel"` |
| Mật khẩu | `password`, `autoComplete="new-password"`, gợi ý "Tối thiểu 6 ký tự" |
| Nhập lại mật khẩu | `password`, `autoComplete="new-password"` |
| `Checkbox` | "Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của BeeSky" (bắt buộc) |
| `Button` primary `lg` | "Tiếp tục" — nút primary duy nhất; gọi `startRegistration` (kiểm SĐT trong hồ sơ khách hàng + gửi OTP) |

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Lỗi kiểm tra | Lỗi dưới từng ô; ≥ 2 lỗi → `FormErrorSummary` nhận focus; 1 lỗi → focus ô đó |
| Đang gửi | Nút `loading` |
| SĐT đã có tài khoản | Lỗi ô số điện thoại: "Số điện thoại này đã có tài khoản. Vui lòng đăng nhập." |
| SĐT không có trong hệ thống khách hàng | Lỗi ô số điện thoại: "Số điện thoại chưa có trong hệ thống khách hàng. Vui lòng dùng số đã đăng ký khi ký hợp đồng hoặc liên hệ chủ đầu tư." |
| Thành công | `Toast` success "Đăng ký thành công. Vui lòng đăng nhập." → `router.dismissTo('/login')` (không tạo bản sao màn Đăng nhập) và điền sẵn số điện thoại |

## Dữ liệu
2026-10-02: **không hỏi Họ và tên, Email** — tài khoản app gắn với hồ sơ khách hàng có sẵn; `register({ phone, password })` tra hồ sơ theo số điện thoại và lấy họ tên / email / mã KH từ đó (mock: `mockCustomerRecords` trong `data/mock/user.ts`, ví dụ `0912 345 678`).

## Bước 2 — Xác nhận OTP (2026-10-02)
- Tiêu đề "Xác nhận số điện thoại", phụ đề "Nhập mã N số đã gửi qua Zalo tới {SĐT}." (hiện tại OTP giả `8888`).
- Một `Input` "Mã OTP" (`number-pad`, `one-time-code`, `maxLength` = độ dài mã, chỉ nhận chữ số) + `Button` primary "Xác nhận".
- Hàng dưới: "Gửi lại mã sau N giây" (đếm ngược từ `resendIn`) → hết giờ thành `TextLink` "Gửi lại mã"; `TextLink` "Đổi số điện thoại" quay lại bước 1 (giữ nguyên dữ liệu đã nhập).
- Lỗi OTP (sai / hết hạn / quá 5 lần) hiện dưới ô OTP và focus lại ô.
- Thành công: Toast "Tạo tài khoản thành công. Vui lòng đăng nhập." → `/login` điền sẵn SĐT.
Luồng dữ liệu: `docs/auth-flow.md`.
