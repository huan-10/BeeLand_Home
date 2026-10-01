# Trang: Đăng nhập (`app/login.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Mục nào không nhắc tới → theo Master.

## Khác Master
- **Không có điều hướng** (bottom tab / sidebar ẩn) — màn hình nằm ngoài nhóm `(app)`.
- Được dùng **gradient lớn** cho panel thương hiệu (desktop), ngoại lệ của anti-pattern "gradient ngoài thẻ tổng quan". Gradient `primary.500 → primary.700`, mọi chữ trên panel là `textOnPrimary` (trắng), logo `inverted`.
- Tiêu đề "Đăng nhập" dùng `h1` nhưng có logo phía trên trên mobile.

## Bố cục
| | Mobile (< 768px) | Desktop (≥ 768px) |
|---|---|---|
| Khung | 1 cột, form căn giữa dọc, lề `ml` | 2 cột: panel thương hiệu trái (tối đa `layout.brandPanelMaxWidth`) + form phải |
| Logo | Logo `lg` trên tiêu đề | Logo `lg` inverted trên panel |
| Form | Không bọc thẻ, rộng tối đa `layout.formMaxWidth` | Bọc trong `Card` padding `xl`, `shadows.md` |
| Nội dung marketing | Ẩn | Tiêu đề `display` + mô tả + 3 dòng tính năng có icon tích |

## Thành phần chính
- `Input` Email (icon mail, `keyboardType="email-address"`, `autoComplete="email"`) → `Input` Mật khẩu (`password`, nút hiện/ẩn, `autoComplete="password"`), Enter chuyển ô / gửi form.
- `Button` primary `lg` full width "Đăng nhập" — **nút primary duy nhất**.
- Hộp gợi ý tài khoản demo: nền `info` pastel, nút "Điền nhanh" (ẩn khi `demoAccountHint = null`).

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Mặc định | Ô trống, nút bật |
| Lỗi kiểm tra | Lỗi tiếng Việt ngay dưới từng ô (Vui lòng nhập email / Email không hợp lệ / Mật khẩu ≥ 6 ký tự); lỗi xóa khi người dùng sửa ô |
| Đang gửi | Nút `loading` (spinner, disabled) |
| Sai thông tin | Hộp cảnh báo `danger` pastel có icon phía trên form, `role="alert"`: "Email hoặc mật khẩu không đúng…" |
| Thành công | Điều hướng tự động vào Trang chủ (route guard) |

Không chặn dán / trình quản lý mật khẩu (skill: `accessible-authentication`).
