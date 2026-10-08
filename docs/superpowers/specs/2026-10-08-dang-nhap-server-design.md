# App khách hàng — đăng nhập trên server (bỏ tài khoản hệ thống, giai đoạn 1)

Ngày: 2026-10-08 · Trạng thái: người dùng duyệt thiết kế trong chat ("oke bạn"). Giai đoạn 2 (đọc dữ liệu theo phiên) và 3 (xoá `SERVICE_ACCOUNT`, đổi mật khẩu `beesky1/admin`) làm sau.

## 1. Mục tiêu
Đăng nhập, tự liên kết công ty mới, dò công ty mới, kết nối NOXH không còn dùng JWT tài khoản hệ thống. App **không gọi `fn_portal_account_set_password`** nữa → tạo/đổi mật khẩu chỉ qua OTP hoặc tự liên kết sau khi mật khẩu đúng. Giao diện không đổi.

## 2. Server — `beeland/supabase/migrations/20261009190000_portal_app_dang_nhap.sql` (role `postgres`, chỉ thêm hàm)

### `fn_portal_app_dang_nhap(p_login text, p_password text) → jsonb` (anon)
1. `p_login`: SĐT (`_portal_normalize_phone`) hoặc CCCD 12 số; khác → `{error:'Nhập số điện thoại 10 số hoặc CCCD 12 số', ma:'SAI_DANG'}`.
2. Hồ sơ: SĐT khớp `dien_thoai`/`di_dong` chuẩn hoá; CCCD khớp số của `cccd`/`so_cmnd`. SĐT của lượt (CCCD) = SĐT hồ sơ đầu tiên. Sắp `ma_ctdk, created_at, id`.
3. Mỗi công ty (giống `planCompanyLogins`): tài khoản đầu tiên của các hồ sơ công ty đó —
   - không active → bỏ công ty;
   - tài khoản website (`nguon_web_config_id` hoặc `pham_vi='CHON'`) → `fn_portal_site_login(slug website nguồn, không có thì website mau4 của công ty, login = username ?? SĐT)`; phiên chỉ NOXH;
   - còn lại → `fn_portal_app_login(công ty, username ?? SĐT)`; bị từ chối mà công ty có mau4 → thử `fn_portal_site_login` (như app cũ);
   - chưa có tài khoản → mục tiêu tự liên kết (hồ sơ tạo sớm nhất).
4. Không có mục tiêu đăng nhập nào → `{error: ACCOUNT_NOT_FOUND, ma:'KHONG_CO_TAI_KHOAN'}`. Có mà không thành công → `{error:<lỗi đầu>, errors:[…], ma:'SAI_MAT_KHAU'}` (app dùng `loginRejectMessage(errors)`).
5. Có ≥ 1 phiên hợp đồng → tự liên kết: khoá `portal_phone:<ctdk>:<sdt>`, bỏ nếu `_portal_phone_da_dung`; INSERT tài khoản (`username`=SĐT, bcrypt, `TAT_CA`) rồi `fn_portal_app_login`. Lỗi một công ty không chặn công ty khác.
6. Công ty có phiên hợp đồng + website mau4 → thêm phiên NOXH bằng `fn_portal_site_login` (lỗi bỏ qua).
7. Trả `{data:{sdt, cong_ty:[{company_id, ten_ct, token, account_id, khach_hang_id, username, noxh_slug, noxh_token, khach_hang:{cột cloud_customers}}]}}`.

### `fn_portal_app_cong_ty_moi(p_token text, p_da_co uuid[]) → jsonb` (anon, chỉ đọc)
Phiên app (`web_config_id IS NULL`). SĐT = SĐT tài khoản (như `_portal_app_ho_so_tk`). Công ty có hồ sơ khớp SĐT, không thuộc `p_da_co`, chưa có tài khoản hoặc tài khoản active không phải tài khoản website → `{data:[{company_id, ten_ct, khach_hang_id, ten_kh, ma_so_kh}]}`.

## 3. App
- `services/supabase/portal.ts`: `appSignIn(login, password)`, `findNewCompaniesByToken(token, known)`; bỏ dùng `findCustomersByPhone/Cccd`, `getPortalAccount`, `setPortalPassword`, `getCompanyNames` trong luồng đăng nhập.
- `services/authService.ts`: `apiLogin` → `appSignIn` → `CompanySession[]` (+ `profilesFor`); `apiLinkNewCompanies` → `appSignIn(sđt phiên, mật khẩu)`, giữ công ty mới, `fn_portal_logout` token thừa; `apiFindNewCompanies` → `findNewCompaniesByToken`; `connectNoxh` dùng `noxhSite` + `loginName` đã lưu (phiên cũ thiếu → `getNoxhSites` tạm, bỏ ở giai đoạn 2).
- `CompanySession.loginName?: string` (username của tài khoản).
- Mã lỗi: `KHONG_CO_TAI_KHOAN` → field `identifier`; `SAI_MAT_KHAU` → `password` + `loginRejectMessage(errors)`; `SAI_DANG` → `identifier`.

## 4. Kiểm thử
- SQL `beeland/supabase/tests/portal_app_dang_nhap.sql` (BEGIN … ROLLBACK): không có tài khoản; sai mật khẩu; khoá sau 5 lần; đăng nhập CCCD (username nhân viên); tự liên kết công ty mới; bỏ công ty có SĐT đã dùng; tài khoản website NOXH → chỉ phiên NOXH; dò công ty mới.
- App: viết lại các test đăng nhập trong `tests/noxh-api.test.cjs` theo server giả mới; `tsc`, lint, `npm test`, build web.
