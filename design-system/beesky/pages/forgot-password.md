# Trang: Quên mật khẩu (`app/forgot-password.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Khung, ảnh nền, bố cục mobile/desktop **giống `login.md`**.

## Khác Đăng nhập
- Một ô duy nhất "Số điện thoại" (`keyboardType="phone-pad"`, `autoComplete="tel"`), Enter gửi form trên mọi nền tảng. Hướng dẫn gửi qua SMS (tài khoản không dùng email).
- Nút primary `lg` "Gửi hướng dẫn"; footer "Nhớ mật khẩu rồi?" + `TextLink` "Đăng nhập".
- Không có `FormErrorSummary` (chỉ một ô → focus thẳng vào ô lỗi).

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Lỗi kiểm tra | Lỗi dưới ô + focus ô (cùng thông điệp với Đăng nhập) |
| Đang gửi | Nút `loading` |
| Đã gửi | Tiêu đề đổi thành "Kiểm tra tin nhắn"; `StateView` tông `success`, icon tin nhắn, `role="alert"`; nút secondary "Quay lại đăng nhập" |

Thông điệp thành công **không tiết lộ** tài khoản có tồn tại hay không ("Nếu … đã đăng ký, bạn sẽ nhận được…").
