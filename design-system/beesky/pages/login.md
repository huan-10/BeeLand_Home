# Trang: Đăng nhập (`app/login.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Khung chung dùng `components/layout/AuthLayout.tsx` (áp dụng cho cả `register.md`, `forgot-password.md`).

## Khác Master
- **Không có điều hướng** (thanh tab nổi / sidebar) — nằm ngoài nhóm `(app)`; được bảo vệ bởi `Stack.Protected guard={!isAuthenticated}`.
- **Ảnh nền khu đô thị** (`assets/images/auth-city.jpg`) + **gradient overlay** — ngoại lệ của anti-pattern "gradient trang trí":
  - Mobile: ảnh cao `sizes.authHero.mobile` + safe area; overlay `overlay.heroScrim` (tối nhẹ phía trên cho chữ trắng) → trong suốt → `overlay.authFadeMid` → `semantic.bg` (mờ dần vào nền).
  - Desktop: panel trái phủ `overlay.brandTint` (xanh đậm) → `overlay.brandTintStrong` (xanh đêm ink), `overflow: hidden`; 3 dòng tính năng có dấu tích trong ô tròn trắng mờ.
- Chữ trên ảnh luôn `textInverse` (trắng, trên lớp phủ tối/xanh đậm ≥ 4.5:1), logo `inverted`.
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
3. `Input` "Số điện thoại" (**chỉ đăng nhập bằng số điện thoại**, không nhận email): icon điện thoại, `autoComplete="tel"`, `textContentType="telephoneNumber"`, `keyboardType="phone-pad"`.
4. `Input` "Mật khẩu": `password` (nút Hiện/Ẩn mật khẩu có nhãn), `autoComplete="current-password"`.
5. Hàng: `Checkbox` "Ghi nhớ đăng nhập" (mặc định bật) · `TextLink` "Quên mật khẩu?" → `/forgot-password`.
6. `Button` primary `lg` full width "Đăng nhập" — **nút primary duy nhất**.
7. Hộp tài khoản demo (nền `info` pastel, số điện thoại + mật khẩu, "Điền nhanh"); ẩn khi `demoAccountHint = null`.
8. Footer: "Chưa có tài khoản?" + `TextLink` "Đăng ký" → `/register`.

## Bàn phím & web
- Web: **Enter ở bất kỳ ô nào gửi form**. Mobile: Enter ở ô định danh chuyển sang ô mật khẩu, Enter ở ô mật khẩu gửi form.
- Focus ring `:focus-visible` 2px `focusRing` (`primary.700`) cho nút/link/checkbox; ô nhập dùng viền xanh + `shadows.focusHalo`.
- Không chặn dán và trình quản lý mật khẩu (skill: `accessible-authentication`).

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Mặc định | Ô trống (hoặc điền sẵn số điện thoại khi quay về từ Đăng ký), "Ghi nhớ" bật |
| Lỗi kiểm tra (client) | Lỗi tiếng Việt ngay dưới từng ô (`role="alert"`, `aria-describedby`); 2 lỗi → `FormErrorSummary` nhận focus, mỗi dòng là link tới ô; 1 lỗi → focus vào ô lỗi. Lỗi của ô biến mất khi người dùng sửa ô đó |
| Đang gửi | Nút `loading`: spinner, `disabled`, `aria-busy` |
| Không tìm thấy tài khoản | Lỗi gắn ô **định danh**: "Không tìm thấy tài khoản với số điện thoại này." + focus ô đó |
| Sai mật khẩu | Lỗi gắn ô **mật khẩu**: "Mật khẩu không đúng. Vui lòng thử lại hoặc chọn "Quên mật khẩu?"." + focus ô đó |
| SĐT ở nhiều công ty | Modal **"Chọn công ty"** (`CompanyPickerDialog`): mỗi dòng là một nút (icon `building`, tên công ty `bodyStrong`, "Tên khách · Mã KH" `caption`, cao ≥ 52); đang chọn → spinner. Đóng modal = ở lại màn đăng nhập |
| Thành công | `AuthContext` → route guard chuyển vào Trang chủ. "Ghi nhớ" bật: phiên lưu AsyncStorage (giữ sau khi đóng app/tab); tắt: web `sessionStorage` (giữ khi tải lại, mất khi đóng tab), native giữ trong bộ nhớ |
| Đã đăng nhập mà mở `/login` | Chuyển về Trang chủ |

Thông điệp kiểm tra định dạng: "Vui lòng nhập số điện thoại" · "Số điện thoại phải gồm 10 số và bắt đầu bằng 0" · "Vui lòng nhập mật khẩu".

> 2026-10-02: bỏ khối "hoặc tiếp tục với" + nút Google / Apple theo yêu cầu (chưa có đăng nhập mạng xã hội).

> 2026-10-02: SĐT có tài khoản ở **nhiều công ty** → `Dialog` "Chọn công ty" (mô tả + mỗi công ty một `Button` `outline` full width); chọn → đăng nhập lại kèm `companyId`. Đóng hộp thoại → ở lại màn đăng nhập. Luồng: `docs/auth-flow.md`.

## Đăng nhập bằng SĐT hoặc CCCD (2026-10-05)
- Ô đầu: nhãn "Số điện thoại hoặc CCCD", gợi ý dưới ô "Tài khoản đăng ký trên website nhà ở xã hội đăng nhập được bằng số CCCD.", `autoComplete="username"`. Lỗi: "Vui lòng nhập số điện thoại hoặc CCCD" / "Nhập số điện thoại 10 số hoặc CCCD 12 số".
