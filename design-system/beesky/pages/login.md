# Trang: Đăng nhập (`app/login.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Khung chung dùng `components/layout/AuthLayout.tsx` (áp dụng cho cả `register.md`, `forgot-password.md`).

## Khác Master
- **Không có điều hướng** (thanh tab nổi / sidebar) — nằm ngoài nhóm `(app)`; được bảo vệ bởi `Stack.Protected guard={!isAuthenticated}`.
- **Ảnh nền khu đô thị** (`assets/images/auth-city.jpg`) + **gradient overlay** — ngoại lệ của anti-pattern "gradient trang trí":
  - Mobile: ảnh cao `sizes.authHero.mobile` + safe area; overlay `overlay.heroScrim` (tối nhẹ phía trên cho chữ trắng) → trong suốt → `overlay.authFadeMid` → `semantic.bg` (mờ dần vào nền).
  - Desktop: panel trái phủ `overlay.brandTint` (cam đậm) → `overlay.brandTintStrong` (nâu cà phê ink), `overflow: hidden`; 3 dòng tính năng có dấu tích trong ô tròn trắng mờ.
- Chữ trên ảnh luôn `textInverse` (trắng, trên lớp phủ tối/cam đậm ≥ 4.5:1), logo `inverted`.
- Animation vào màn hình (`FadeIn`, `motion.enter` + `motion.stagger`) — chỉ ở các màn xác thực, tự tắt khi giảm chuyển động.

## Bố cục

> Khác Master: màn xác thực chuyển sang 2 cột ở **1024px** (không phải 768px) vì ở 768px panel 50% làm form chỉ còn ~320px.

| | Mobile & tablet (< 1024px) | Desktop (≥ 1024px) |
|---|---|---|
| Khung | 1 cột: ảnh hero (logo + slogan) phía trên, thẻ form chồng lên mép dưới ảnh (`-spacing.xl`) | 2 cột: trái panel ảnh thương hiệu (tối đa `layout.brandPanelMaxWidth`), phải form căn giữa |
| Form | `Card` padding `ml`, bo 28, `shadows.raised`, rộng theo màn hình (lề 16), tối đa 440px căn giữa | `Card` padding `xl`, bo 28, `shadows.raised`, **tối đa 440px** (`layout.formMaxWidth`) |
| Thương hiệu | Logo `lg` + slogan `bodyStrong` | Logo `lg` + slogan `display` + mô tả + 3 dòng tính năng có icon tích + © năm |
| Link Đăng ký | Dưới thẻ form, căn giữa | Dưới thẻ form, căn giữa |

## Thành phần chính (thứ tự = thứ tự Tab)
1. Tiêu đề `title` "Đăng nhập" (role header) + phụ đề.
2. `FormErrorSummary` — chỉ khi có **≥ 2 lỗi**.
3. `Input` "Số điện thoại hoặc email": icon người, `autoComplete="username"`, `textContentType="username"`, `keyboardType="email-address"`, không viết hoa/tự sửa.
4. `Input` "Mật khẩu": `password` (nút Hiện/Ẩn mật khẩu có nhãn), `autoComplete="current-password"`.
5. Hàng: `Checkbox` "Ghi nhớ đăng nhập" (mặc định bật) · `TextLink` "Quên mật khẩu?" → `/forgot-password`.
6. `Button` primary `lg` full width "Đăng nhập" — **nút primary duy nhất**.
7. `Divider` "hoặc tiếp tục với" + 2 `Button` `outline` Google / Apple (logo `BrandMark` google / apple, prop `brand` của Button) → `Toast` "Tính năng sắp ra mắt".
8. Hộp tài khoản demo (nền `info` pastel, "Điền nhanh"); ẩn khi `demoAccountHint = null`.
9. Footer: "Chưa có tài khoản?" + `TextLink` "Đăng ký" → `/register`.

## Bàn phím & web
- Web: **Enter ở bất kỳ ô nào gửi form**. Mobile: Enter ở ô định danh chuyển sang ô mật khẩu, Enter ở ô mật khẩu gửi form.
- Focus ring `:focus-visible` 2px `focusRing` (`primary.700`) cho nút/link/checkbox; ô nhập dùng viền cam + `shadows.focusHalo`.
- Không chặn dán và trình quản lý mật khẩu (skill: `accessible-authentication`).

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Mặc định | Ô trống (hoặc điền sẵn email khi quay về từ Đăng ký), "Ghi nhớ" bật |
| Lỗi kiểm tra (client) | Lỗi tiếng Việt ngay dưới từng ô (`role="alert"`, `aria-describedby`); 2 lỗi → `FormErrorSummary` nhận focus, mỗi dòng là link tới ô; 1 lỗi → focus vào ô lỗi. Lỗi của ô biến mất khi người dùng sửa ô đó |
| Đang gửi | Nút `loading`: spinner, `disabled`, `aria-busy` |
| Không tìm thấy tài khoản | Lỗi gắn ô **định danh**: "Không tìm thấy tài khoản với số điện thoại hoặc email này." + focus ô đó |
| Sai mật khẩu | Lỗi gắn ô **mật khẩu**: "Mật khẩu không đúng. Vui lòng thử lại hoặc chọn "Quên mật khẩu?"." + focus ô đó |
| Thành công | `AuthContext` → route guard chuyển vào Trang chủ. "Ghi nhớ" bật: phiên lưu AsyncStorage (giữ sau khi đóng app/tab); tắt: web `sessionStorage` (giữ khi tải lại, mất khi đóng tab), native giữ trong bộ nhớ |
| Đã đăng nhập mà mở `/login` | Chuyển về Trang chủ |

Thông điệp kiểm tra định dạng: "Vui lòng nhập số điện thoại hoặc email" · "Email không đúng định dạng (ví dụ: ten@email.com)" · "Số điện thoại phải gồm 10 số và bắt đầu bằng 0" · "Vui lòng nhập mật khẩu".
