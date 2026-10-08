# App khách hàng — OTP thật cho Đăng ký + Quên mật khẩu

Ngày: 2026-10-08 · Trạng thái: đã duyệt hướng (người dùng chọn "Hàm riêng cho app", phạm vi "Đăng ký + Quên MK").

## 1. Mục tiêu

Thay mã cố định `8888` (app tự so) bằng OTP thật như web: mã 6 số ngẫu nhiên, hạn 5 phút, gửi qua hàng đợi C2 (`tb_tin`: ZNS → SMS), **server kiểm mã** rồi mới tạo tài khoản / đặt lại mật khẩu.

Thành công khi:
- Đăng ký: khách nhận mã thật trên Zalo/SMS; mã đúng → tài khoản được tạo ở mọi công ty có hồ sơ khớp SĐT; sai/hết hạn → bị chặn.
- Quên mật khẩu: SĐT đã đăng ký → nhận mã → đặt mật khẩu mới (áp cho mọi công ty); SĐT chưa đăng ký → báo rõ "chưa đăng ký".
- Không sửa hàm/bảng nào web đang dùng.

## 2. Vì sao không dùng lại hàm NOXH của web

`fn_portal_noxh_register_start/verify` và bảng `cloud_portal_otp` gắn với website `mau4` (`web_config_id`, `cccd` NOT NULL), bắt CCCD + họ tên, tự tạo khách và giới hạn tài khoản theo website. App đăng ký chỉ bằng SĐT, khớp hồ sơ có sẵn ở nhiều công ty, tài khoản `TAT_CA`. Nên thêm bảng + hàm riêng, dùng lại các hàm phụ dùng chung: `_portal_normalize_phone`, `_portal_phone_da_dung`, `_tb_otp_san_sang`, `_tb_them`, `_portal_otp_ip_hash` không dùng (trần IP đang tắt).

## 3. Server (repo `beeland`, migration `supabase/migrations/20261009170000_portal_app_otp.sql`)

### 3.1 Bảng `cloud_portal_app_otp`
| Cột | Kiểu |
|---|---|
| `id` | uuid PK default `gen_random_uuid()` |
| `sdt` | text NOT NULL, CHECK `^0[0-9]{9}$` |
| `muc_dich` | text NOT NULL CHECK ∈ (`DANG_KY`, `QUEN_MK`) |
| `code_hash` | text NOT NULL (bcrypt) |
| `ma_ctdk_gui` | uuid NOT NULL → `cloud_companies(id)` ON DELETE CASCADE (công ty dùng kênh để gửi) |
| `expires_at` | timestamptz NOT NULL (now + 5 phút) |
| `attempts` | int NOT NULL default 0 |
| `consumed_at` | timestamptz NULL |
| `created_at` | timestamptz NOT NULL default now() |

Chỉ mục `(sdt, created_at)`. RLS bật, không policy, `REVOKE ALL` khỏi `anon`, `authenticated`. Dòng hết hạn quá 1 ngày bị xoá mỗi lần cấp mã mới.

### 3.2 Hàm phụ `_portal_app_ho_so(p_sdt)` (nội bộ, REVOKE khỏi anon/authenticated)
Trả các hồ sơ khách khớp SĐT ở mọi công ty: `cloud_customers` có `_portal_normalize_phone(dien_thoai)` hoặc `_portal_normalize_phone(di_dong)` = `p_sdt`, kèm tài khoản cổng của hồ sơ (`cloud_portal_accounts` theo `ma_ctdk` + `khach_hang_id`): `account_id`, `is_active`.

### 3.3 `fn_portal_app_otp_gui(p_sdt text, p_muc_dich text) → jsonb` (GRANT anon, authenticated)
Lỗi trả `{ "error": "…" }`, thành công `{ "data": { otp_id, het_han, do_dai_ma: 6, gui_lai_sau: 60 } }`.

1. Chuẩn hoá SĐT; sai → "Số điện thoại không hợp lệ". `p_muc_dich` ngoài 2 giá trị → lỗi.
2. Khoá `pg_advisory_xact_lock(hashtext('portal_app_otp:' || sdt))`.
3. Giới hạn: đã có mã của SĐT trong 60 giây → "Vui lòng chờ … giây rồi gửi lại mã"; ≥ 5 mã trong 1 giờ → "Bạn đã yêu cầu quá nhiều mã, thử lại sau".
4. Hồ sơ = `_portal_app_ho_so(sdt)`.
   - **DANG_KY**: không hồ sơ → "Số điện thoại chưa có trong hệ thống khách hàng. Vui lòng dùng số đã đăng ký khi ký hợp đồng hoặc liên hệ chủ đầu tư." · có tài khoản `is_active` → "Số điện thoại đã có tài khoản. Vui lòng đăng nhập — hồ sơ ở công ty mới sẽ được tự liên kết." · hồ sơ cần tạo = hồ sơ chưa có tài khoản; rỗng (chỉ còn tài khoản khoá) → "Tài khoản của số điện thoại này đang bị khoá. Vui lòng liên hệ chủ đầu tư." · công ty của hồ sơ cần tạo có `_portal_phone_da_dung(ma_ctdk, sdt)` → "Số điện thoại đã dùng cho tài khoản khác, vui lòng liên hệ chủ đầu tư".
   - **QUEN_MK**: hồ sơ có tài khoản `is_active` = hồ sơ đích; không có → "Số điện thoại chưa đăng ký tài khoản."
5. Công ty gửi = công ty đầu tiên (theo `ma_ctdk`) trong hồ sơ đích có `_tb_otp_san_sang(ma_ctdk, 'OTP_DANG_KY' | 'OTP_QUEN_MK')`; không có → "Chủ đầu tư chưa cấu hình gửi tin xác thực, vui lòng liên hệ chủ đầu tư".
6. Huỷ (`consumed_at = now()`) mã chưa dùng cũ của cùng SĐT + mục đích; sinh mã 6 số (`gen_random_bytes`), insert; `_tb_them(ma_ctdk_gui, su_kien, khach_hang_id của hồ sơ đầu, sdt, NULL, {ma, phut: '5'}, 'PORTAL_OTP', otp_id, now(), 0)`. Lỗi trong khối → "Không thể gửi mã xác thực, vui lòng thử lại" (huỷ cả OTP).

### 3.4 `fn_portal_app_otp_xac_minh(p_otp_id uuid, p_code text, p_password text) → jsonb` (GRANT anon, authenticated)
Thành công `{ "data": { so_tai_khoan } }`.

1. Mật khẩu `btrim` dài 6–72 (đổi từ 8 ngày 2026-10-08, migration `20261009170100`) → nếu không: "Mật khẩu phải từ 6 đến 72 ký tự" (không tính lần thử).
2. `SELECT … FOR UPDATE` mã: không có → "Mã OTP không đúng"; đã dùng hoặc `attempts ≥ 5` → "Mã đã bị huỷ, vui lòng yêu cầu mã mới"; hết hạn → "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới"; sai → `attempts + 1`, lần thứ 5 → "Mã đã bị huỷ…", còn lại "Mã OTP không đúng".
3. Khoá SĐT như 3.3; tính lại hồ sơ đích.
   - **DANG_KY**: với mỗi hồ sơ chưa có tài khoản (mỗi công ty): khoá `portal_phone:<ma_ctdk>:<sdt>`; `_portal_phone_da_dung` → bỏ qua công ty đó; còn lại INSERT `cloud_portal_accounts (ma_ctdk, khach_hang_id, username = sdt, password_hash = crypt(bf), is_active, pham_vi 'TAT_CA', phone_verified_at = now())` — trigger `trg_portal_account_fill_kh` tự điền `di_dong`, `cccd`. Không tạo được tài khoản nào → "Số điện thoại đã dùng cho tài khoản khác, vui lòng liên hệ chủ đầu tư" (mã vẫn bị dùng).
   - **QUEN_MK**: UPDATE mọi tài khoản đích: `password_hash`, `failed_count = 0`, `locked_until = NULL`, `phone_verified_at = coalesce(phone_verified_at, now())`, `updated_at = now()`; DELETE `cloud_portal_sessions` của các tài khoản đó.
4. `consumed_at = now()`. Lỗi bất ngờ → "Không thể hoàn tất, vui lòng thử lại".

### 3.5 Triển khai
Chạy thử toàn file trong `BEGIN … ROLLBACK` (+ kịch bản kiểm ở mục 5) trên DB thật trước; áp thật cần người dùng chạy hoặc cấp quyền (lệnh ghi của Claude bị chặn ở phiên này). Sau khi áp: `NOTIFY pgrst, 'reload schema'`.

## 4. App (`beeland-app-KH`)

- `services/supabase/portal.ts`: `sendAppOtp(phone, purpose)`, `verifyAppOtp(otpId, code, password)` — anon RPC, `{ error }` → `ServiceError`.
- `services/authService.ts`:
  - `startRegistration(phone)` / `confirmRegistration(requestId, otp, password)` gọi 2 hàm trên (`requestId` = `otp_id`, `otpLength` = 6, `resendIn` = 60). Bỏ `pendingRegistrations`, `TEMP_OTP`, vòng `setPortalPassword` ở đăng ký.
  - Thay `requestPasswordReset` bằng `startPasswordReset(phone)` → `RegistrationStart`-like, `confirmPasswordReset(requestId, otp, password)`.
  - Chế độ `mock`: giữ mã giả (đăng ký + quên MK) để chạy giao diện offline.
- `app/forgot-password.tsx`: 3 bước trên một màn — (1) SĐT → "Gửi mã xác nhận"; lỗi "chưa đăng ký" kèm link Đăng ký. (2) "Nhập mã 6 số đã gửi qua Zalo tới …": ô OTP, Mật khẩu mới, Nhập lại mật khẩu, nút "Đặt lại mật khẩu", "Gửi lại mã sau N giây", "Đổi số điện thoại". (3) "Đã đặt lại mật khẩu" + nút Đăng nhập (điền sẵn SĐT).
- `app/register.tsx`: giao diện giữ nguyên; độ dài mã lấy từ `otpLength` (6).
- `docs/auth-flow.md`: cập nhật luồng đăng ký + quên mật khẩu.

Ngoài phạm vi: nút "Gửi qua SMS" riêng; tự liên kết công ty mới khi đăng nhập (vẫn dùng `fn_portal_account_set_password` như cũ); đổi mật khẩu trong app.

## 5. Kiểm thử

- **SQL (BEGIN … ROLLBACK, không gửi tin thật — dữ liệu tin bị rollback):** SĐT sai định dạng; chưa có hồ sơ; đã có tài khoản (DANG_KY); quên MK chưa đăng ký; gửi lại trong 60 s; 6 lần/giờ; sai mã 5 lần → huỷ; hết hạn (chỉnh `expires_at` trong giao dịch); đăng ký thành công tạo tài khoản `TAT_CA` + `phone_verified_at`; trùng username → lỗi rõ; quên MK đổi `password_hash`, xoá phiên, mở khoá.
- **App:** `npx tsc --noEmit`, `npm test`.
- **Thử thật:** người dùng bấm trên app với SĐT test (nhận Zalo).
