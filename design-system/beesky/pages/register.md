# Trang: Đăng ký (`app/register.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Khung, ảnh nền, bố cục mobile/desktop và hành vi bàn phím **giống `login.md`**.

## Khác Đăng nhập
- Tiêu đề "Tạo tài khoản"; footer "Đã có tài khoản?" + `TextLink` "Đăng nhập" (quay lại).
- Không có nút Google/Apple, không có hộp tài khoản demo.
- Mobile: Enter chuyển lần lượt qua các ô; Enter ở ô cuối gửi form. Web: Enter ở ô cuối gửi form.

## Thành phần chính (thứ tự Tab)
| Ô | Thuộc tính |
|---|-----------|
| Họ và tên | icon người, `autoComplete="name"`, viết hoa chữ đầu |
| Số điện thoại | icon điện thoại, `keyboardType="phone-pad"`, `autoComplete="tel"` |
| Email | icon thư, `autoComplete="email"`, `keyboardType="email-address"` |
| Mật khẩu | `password`, `autoComplete="new-password"`, gợi ý "Tối thiểu 6 ký tự" |
| Nhập lại mật khẩu | `password`, `autoComplete="new-password"` |
| `Checkbox` | "Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của BeeSky" (bắt buộc) |
| `Button` primary `lg` | "Tạo tài khoản" — nút primary duy nhất |

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Lỗi kiểm tra | Lỗi dưới từng ô; ≥ 2 lỗi → `FormErrorSummary` nhận focus; 1 lỗi → focus ô đó |
| Đang gửi | Nút `loading` |
| Email / SĐT đã tồn tại | Lỗi gắn đúng ô (`ServiceError.field`): "Email này đã được đăng ký." / "Số điện thoại này đã được đăng ký." |
| Thành công | `Toast` success "Đăng ký thành công. Vui lòng đăng nhập." → `router.dismissTo('/login')` (không tạo bản sao màn Đăng nhập) và điền sẵn email |
