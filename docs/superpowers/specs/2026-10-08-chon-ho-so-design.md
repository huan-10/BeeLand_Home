# App khách hàng — chọn hồ sơ khách hàng sau khi đăng nhập

Ngày: 2026-10-08 · Trạng thái: người dùng đã chốt thiết kế trong chat ("Một danh sách chung", "mọi màn theo hồ sơ", "Phiên nhớ hồ sơ").

## 1. Bối cảnh

- Đăng ký (OTP, `fn_portal_app_otp_xac_minh`) đã tạo **mỗi công ty 1 tài khoản** `cloud_portal_accounts`; công ty có nhiều hồ sơ `cloud_customers` cùng SĐT vẫn **1 tài khoản** (gắn hồ sơ tạo sớm nhất). Giữ nguyên.
- Thiếu: tài khoản chỉ thấy dữ liệu của **một** hồ sơ. Ví dụ 0923716866 ở Công ty BRG có KH-893487 và KH-893531 → app chỉ xem được KH-893487.
- Mục tiêu: sau khi đăng nhập khách chọn được **hồ sơ khách hàng** (ở mọi công ty), mọi màn (hợp đồng, lịch thanh toán, phiếu thu, bàn giao, yêu cầu, thanh toán online) theo hồ sơ đang chọn. Đồng bộ với hệ thống (1 tài khoản / công ty).

## 2. Server (repo `beeland`, migration `supabase/migrations/20261009180000_portal_app_chon_ho_so.sql`)

1. `ALTER TABLE cloud_portal_sessions ADD COLUMN IF NOT EXISTS khach_hang_id uuid REFERENCES cloud_customers(id) ON DELETE SET NULL` — hồ sơ đang xem của phiên; NULL = hồ sơ của tài khoản.
2. `_portal_session(p_token)`: thân lấy từ `pg_get_functiondef` thật, chỉ đổi cột thứ 3 thành `COALESCE(s.khach_hang_id, a.khach_hang_id)`. Phiên web không bao giờ đặt cột → web không đổi. Mọi hàm đọc hồ sơ qua `_portal_session` (yêu cầu: `_portal_req_ctx`; thanh toán: `_portal_pay_ctx`) tự theo hồ sơ đang chọn.
3. `_portal_app_ho_so_tk(p_account_id uuid) RETURNS SETOF cloud_customers` (nội bộ, REVOKE anon/authenticated): hồ sơ **cùng `ma_ctdk`** với tài khoản có `_portal_normalize_phone(dien_thoai|di_dong)` = SĐT tài khoản (`_portal_normalize_phone(username)`, không có thì `_portal_normalize_phone(di_dong)`), **luôn gồm** hồ sơ của tài khoản; sắp `created_at, id`.
4. `fn_portal_app_ho_so_list(p_token text) → jsonb` (anon): phiên hợp đồng hợp lệ (như `_portal_account_by_token`: `web_config_id IS NULL OR template_code <> 'mau4'`), không thì `{error:'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'}`. Trả `{data:[{id, ma_ctdk, ma_so_kh, ten_kh, ten_cong_ty, dien_thoai, di_dong, email, dia_chi, cccd, so_cmnd, dang_xem}]}`.
5. `fn_portal_app_chon_ho_so(p_token text, p_khach_hang_id uuid) → jsonb` (anon): cùng điều kiện phiên; hồ sơ ngoài danh sách (3) → `{error:'Hồ sơ không thuộc tài khoản này'}`; đúng → `UPDATE cloud_portal_sessions SET khach_hang_id = NULLIF(p_khach_hang_id, <hồ sơ tài khoản>) WHERE token = p_token` → `{data:{ok:true}}`.
6. Phiên NOXH (`mau4`) không đổi (hàm 4, 5 từ chối phiên `mau4`).
7. `fn_portal_my_contracts` (đọc hồ sơ của tài khoản) không đổi — app chỉ dùng nó để kiểm token; hợp đồng app đọc theo `customerId` của phiên app.

## 3. App (`beeland-app-KH`)

- `types/user.ts`: `CompanySession.profiles?: CustomerProfile[]` (`{ customerId: string; user: User }`); `CompanyOption.customerId?: string`.
- `services/supabase/portal.ts`: `listMyProfiles(token) → CustomerRow[] + dangXem`, `chooseProfile(token, customerId)`.
- `services/authService.ts`: sau khi có phiên hợp đồng mỗi công ty (`toCompanySessions`) gọi `listMyProfiles` → `profiles` (lỗi → chỉ hồ sơ hiện tại); `customerId`/`user` theo hồ sơ `dang_xem`. Export `selectProfile(session, companyId, customerId)` gọi `chooseProfile` (bỏ qua khi phiên không có token hợp đồng).
- `lib/companySession.ts`: `profileOptions(session) → CompanyOption[]` (mỗi hồ sơ một dòng, theo thứ tự công ty); `withActiveCompany(session, companyId, customerId?)` đổi cả hồ sơ (cập nhật `customerId`, `user` của phiên và của công ty trong `companies`).
- `contexts/AuthContext.tsx`: `companies` = `profileOptions`; `signIn` trả danh sách khi > 1 hồ sơ; `selectCompany(companyId, customerId?)` gọi `selectProfile` rồi `withActiveCompany`.
- `components/domain/CompanyPickerDialog.tsx`: tiêu đề "Chọn hồ sơ khách hàng", nhóm theo công ty (tên công ty làm nhãn nhóm, mỗi dòng "mã KH · tên"), đánh dấu hồ sơ đang xem; `onSelect(companyId, customerId)`.
- `app/login.tsx`, `app/(app)/profile.tsx`: truyền `customerId`; mục Cá nhân đổi thành "Chuyển hồ sơ" (giá trị: "mã KH · công ty"), hiện khi ≥ 2 hồ sơ. `app/(app)/_layout.tsx`: `key` gồm cả `customerId` để dựng lại màn khi đổi hồ sơ.

## 4. Kiểm thử

- SQL (`supabase/tests/portal_app_chon_ho_so.sql`, BEGIN … ROLLBACK): danh sách chỉ hồ sơ cùng công ty + cùng SĐT (+ hồ sơ tài khoản), không lấy công ty khác; chọn hồ sơ lạ → lỗi; chọn đúng → `_portal_session` trả hồ sơ mới, `fn_portal_my_requests`/`fn_portal_request_options` theo hồ sơ mới; chọn lại hồ sơ tài khoản → cột NULL; phiên không đặt cột → `_portal_session` trả hồ sơ tài khoản (web y nguyên); phiên `mau4` bị từ chối.
- App: `tests/company-session.test.cjs` thêm ca `profileOptions`, `withActiveCompany(…, customerId)`; `tsc`, `expo lint`, `npm test`, `expo export --platform web`.
- Thử thật: 0923716866 đăng nhập → hộp chọn 2 hồ sơ BRG → chọn KH-893531 → hợp đồng của hồ sơ đó.
