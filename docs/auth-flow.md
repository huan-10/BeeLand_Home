# Đăng ký / đăng nhập bằng số điện thoại (hoặc CCCD)

> **2026-10-05 — Nhà ở xã hội (NOXH).** Tài khoản đăng ký trên website NOXH (`fn_portal_noxh_register_verify`) nằm trong **chính bảng `cloud_portal_accounts`** — một người một tài khoản, một mật khẩu (người dùng xác nhận). App không có luồng đăng ký NOXH riêng.
> - Ô đăng nhập nhận **SĐT hoặc CCCD 12 số** (`parseLoginId`). CCCD → tra `cloud_customers.cccd` / `so_cmnd` (`findCustomersByCccd`).
> - Mỗi công ty có thể có **hai token**: token hợp đồng (`fn_portal_login`) và token NOXH (`fn_portal_site_login(slug website mau4, login, mật khẩu)` → `CompanySession.noxh`). Hàm `fn_portal_noxh_*` chỉ nhận token mau4; token hợp đồng không gọi được hàm NOXH (R19).
> - `fn_portal_login` **từ chối** tài khoản tự đăng ký qua website (`nguon_web_config_id` có giá trị) và tài khoản `pham_vi = 'CHON'` (R21). `fn_portal_account_get` trả hai cột này → `planCompanyLogins(..., noxhSites)` đưa các tài khoản đó vào `siteLogin` (đăng nhập bằng `fn_portal_site_login`, chỉ có token NOXH, `CompanySession.token` vắng). Công ty chỉ có token NOXH → Hợp đồng / Thanh toán / Phiếu thu trả rỗng, không gọi server (`isNoxhOnlySession`), màn rỗng ghi "Khi trúng bốc thăm và ký hợp đồng…".
> - Slug website NOXH theo công ty: đọc `cloud_customer_web_configs` (`template_code = 'mau4'`, `is_active`) bằng JWT hệ thống (`getNoxhSites`, chỉ đọc).
> - Công ty có token hợp đồng: lúc đăng nhập lấy thêm token NOXH (cùng mật khẩu, lỗi thì bỏ qua). Phiên đăng nhập trước bản này (không có token NOXH, app không lưu mật khẩu) → tab NOXH / Cá nhân hiện "Kết nối" → `ConnectNoxhDialog` nhập **mật khẩu hiện tại** (`connectNoxh`).
> - Tài khoản tự đăng ký đăng nhập trên **đúng website đã đăng ký** (slug theo `nguon_web_config_id`, `getNoxhSites().byConfig`). `fn_portal_login` từ chối một tài khoản (ví dụ máy chủ không trả `nguon_web_config_id`) mà công ty có website NOXH → thử lại bằng `fn_portal_site_login`.
> - Phiên NOXH hết hạn (`PHIEN_HET_HAN`) → chỉ bỏ token NOXH của công ty đó, giữ `CompanySession.noxhSite`; không đăng xuất cả app. Còn công ty có `noxhSite` mà không có token (`noxhMissing`) → thẻ "Kết nối" hiện lại. "Kết nối" chỉ thử các công ty đang thiếu token và báo "Mật khẩu không đúng" nếu không công ty nào trong số đó kết nối được.
> - Mở lại app: công ty đang xem không có token hợp đồng → kiểm phiên bằng `fn_portal_noxh_me`.
> - Đăng xuất huỷ mọi token (hợp đồng + NOXH, `sessionTokens`); xoá nháp form NOXH trong bộ nhớ.
> - **CCCD + SĐT trên tài khoản:** nộp hồ sơ NOXH bắt buộc tài khoản có CCCD. `fn_portal_account_set_password` (app gọi khi đăng ký / tự liên kết) chỉ ghi `username` = SĐT — vì vậy tài khoản app tạo trước đây có `cccd`, `di_dong` NULL (tra trên Supabase phải lọc theo `username`). Sau migration `20261005200000_portal_account_cccd` (repo `beeland`), trigger trên `cloud_portal_accounts` tự điền `di_dong` (= `dien_thoai` của khách — SĐT dùng để đăng ký, chuẩn hoá) và `cccd` (12 số, không trùng) từ `cloud_customers` khi tạo tài khoản / đặt lại mật khẩu. Đây là luồng chuẩn người dùng chốt 2026-10-05 (web sẽ theo); không bù dữ liệu cũ (dữ liệu test được xoá tạo lại). Còn thiếu CCCD → "Đăng ký hồ sơ" (app hỏi `fn_portal_noxh_tai_khoan`) hoặc máy chủ báo "Tài khoản chưa có CCCD…" mở hộp **Cập nhật CCCD** (`UpdateCccdDialog` → `fn_portal_noxh_cap_nhat_cccd`).
> - Mock: demo `0901 234 567` / `123456` có cả hai token; `0938 111 222` hoặc CCCD `001 099 012 345` / `123456` (Lê Thu Hà) chỉ có token NOXH. Chạy giao diện không gọi server: `EXPO_PUBLIC_AUTH_BACKEND=mock npx expo start`.
> - ⚠ `fn_portal_site_login` / `fn_portal_login` / `fn_portal_logout` đều ghi phiên vào database thật — chỉ thử với SĐT thử nghiệm.

Cập nhật: 2026-10-05 (một SĐT ở nhiều công ty: tự liên kết + chuyển công ty). Dùng chung database với web `beeland` và `beeland-app_2026`. **Không cần sửa server**: chỉ gọi bảng và hàm đã có sẵn.

## Cách app kết nối (giống app 2026)
- Lớp gọi API: `services/supabase/client.ts` (`restGet`, `rpc`, `edge`). Đây là bản `fetch` của `beeland-app_2026/sevicesSupabase/axiosApiSupabase.ts`:
  - header `apikey` = anon key;
  - `Authorization: Bearer <JWT>`.
- **Anon key bị từ chối đọc bảng** `cloud_customers`, `cloud_portal_accounts`, `cloud_companies` (`42501 permission denied`, đã thử 2026-10-02).
  - Vì vậy trước khi khách đăng nhập, app dùng **tài khoản hệ thống** (nhân viên) đăng nhập `cloud-auth` để lấy JWT, đúng như app 2026 (`services/supabase/serviceAuth.ts`).
  - JWT được lưu lại tới gần lúc hết hạn (sống 7 ngày), vì mỗi lần đăng nhập server ghi thêm một phiên.
  - JWT lưu đệm **gắn với tài khoản đã cấp nó** (`lib/serviceJwtCache.ts`): đổi tài khoản trong `.env.local` → app bỏ JWT cũ, đăng nhập lại.
    - Lỗi 2026-10-05: Simulator còn JWT của tài khoản `brg` (lấy 02/10 13:32, trước khi `.env.local` đổi sang `beesky1`, hạn tới 09/10) → app chỉ tra được khách BRG, không thấy hồ sơ MSR cùng SĐT 0859021385 → không tự liên kết, không hiện chuyển công ty.
- Tài khoản hệ thống nên thuộc công ty **`beesky1`**: RLS và `_jwt_tenant_ok` cho `beesky1` thấy và thao tác **mọi công ty**, nên tra được SĐT ở mọi chủ đầu tư.
  - Cấu hình trong `.env.local`: `EXPO_PUBLIC_KH_SERVICE_COMPANY`, `EXPO_PUBLIC_KH_SERVICE_EMAIL`, `EXPO_PUBLIC_KH_SERVICE_PASSWORD`.
  - Sửa xong phải khởi động lại `npx expo start -c`.
  - **Gốc: công ty `beesky1`**, là công ty toàn quyền của hệ thống (người dùng xác nhận 2026-10-02), thấy được mọi công ty (10 công ty lúc kiểm tra). Tài khoản của một công ty (ví dụ `brg`) chỉ thấy công ty đó.
  - Đã thử đọc 2026-10-02:
    - `0339427467` → khách "Tesst 9999999888" (KH-893482, Công ty BRG);
    - `0369138258` → khách "Test" (KH-00014, công ty MSR);
    - cả hai chưa có tài khoản cổng.
  - ⚠ Tài khoản `beesky1` trong bản build cho phép xem dữ liệu **mọi công ty**: chỉ dùng để chạy thử. Trước khi phát hành phải chuyển sang `portal-auth`.
- Sau khi khách đăng nhập, dữ liệu đi theo **token phiên khách** bằng các hàm anon gọi được (`fn_portal_my_contracts`…). Đây cũng là cách web làm ở `beeland/src/services/PortalAccountService.ts`.

## Luồng

**Đăng ký** (`app/register.tsx` → `startRegistration` / `confirmRegistration`) — **OTP thật từ 2026-10-08**
Server tự kiểm mọi thứ (`beeland/supabase/migrations/20261009170000_portal_app_otp.sql`, bảng `cloud_portal_app_otp`, test `beeland/supabase/tests/portal_app_otp.sql`); app chỉ gọi 2 RPC anon (`services/supabase/portal.ts` → `sendAppOtp` / `verifyAppOtp`, đọc kết quả ở `lib/appOtp.ts`).
1. **Bước 1:** khách nhập SĐT + mật khẩu (6–72 ký tự, `NEW_PASSWORD_MIN_LENGTH`; server `20261009170100_portal_app_otp_mk6`) → **`fn_portal_app_otp_gui(sdt, 'DANG_KY')`**:
   - Tìm `cloud_customers` theo `dien_thoai` / `di_dong` (chuẩn hoá) ở mọi công ty. Không có → "Số điện thoại chưa có trong hệ thống khách hàng…".
   - Đã có tài khoản đang hoạt động ở bất kỳ công ty nào → "Số điện thoại đã có tài khoản. Vui lòng đăng nhập — hồ sơ ở công ty mới sẽ được tự liên kết.". Chỉ còn tài khoản khoá → "…đang bị khoá…".
   - SĐT đã là `username`/`di_dong` của tài khoản **khách khác** cùng công ty ở mọi công ty cần tạo → "Số điện thoại đã dùng cho tài khoản khác, vui lòng liên hệ chủ đầu tư" (ca 0913994696 ngày 2026-10-08 — trước đây lỗi `duplicate key … ux_portal_accounts_username` lúc xác nhận).
   - Hợp lệ → mã 6 số ngẫu nhiên (bcrypt, hạn 5 phút), xếp tin `OTP_DANG_KY` vào hàng đợi C2 (`_tb_them`: ZNS → SMS) bằng kênh của công ty đầu tiên có kênh; không công ty nào có kênh → "Chủ đầu tư chưa cấu hình gửi tin xác thực…". Giới hạn: cách nhau 60 giây, tối đa 5 mã / SĐT / giờ; gửi mã mới huỷ mã cũ.
2. **Bước 2:** nhập mã → **`fn_portal_app_otp_xac_minh(otp_id, mã, mật khẩu)`**: sai 5 lần huỷ mã; đúng → tạo `cloud_portal_accounts` (`username` = SĐT, `pham_vi = 'TAT_CA'`, `phone_verified_at`) cho mỗi công ty chưa có tài khoản (hồ sơ tạo sớm nhất). Xong → về màn Đăng nhập, điền sẵn SĐT.

**Quên mật khẩu** (`app/forgot-password.tsx` → `startPasswordReset` / `confirmPasswordReset`, 2026-10-08)
1. SĐT → `fn_portal_app_otp_gui(sdt, 'QUEN_MK')`: chưa có tài khoản → **báo rõ** "Số điện thoại chưa đăng ký tài khoản." (màn kèm link Đăng ký); chỉ tài khoản khoá → "…đang bị khoá…"; còn lại gửi mã `OTP_QUEN_MK`.
2. Mã + mật khẩu mới + nhập lại → `fn_portal_app_otp_xac_minh`: đặt mật khẩu mới cho tài khoản đang hoạt động ở **mọi công ty** có hồ sơ khớp SĐT **và chính tài khoản dùng SĐT này** (`username` hoặc `di_dong`) — SĐT người thân/sale ghi trên hồ sơ không lấy được tài khoản; `failed_count = 0`, mở khoá, xoá mọi phiên cũ. Không ghi `phone_verified_at` (giữ chính sách quên MK của web). Trần chống bơm tin: `tb_cau_hinh_he_thong.tran_otp_cong_ty_gio` mã / giờ / công ty gửi (mặc định 200).
3. Xong → nút Đăng nhập (điền sẵn SĐT).

**Đăng nhập** (`app/login.tsx` → `login` → `apiLogin`)

> **Từ 2026-10-08 (giai đoạn 1 bỏ tài khoản hệ thống):** cả luồng dưới đây chạy **trên server** trong một hàm anon **`fn_portal_app_dang_nhap(p_login, p_password)`** (`beeland/supabase/migrations/20261009190000_portal_app_dang_nhap.sql`, test `supabase/tests/portal_app_dang_nhap.sql`). App (`services/supabase/portal.ts` → `appSignIn`) không còn tra `cloud_customers`, `fn_portal_account_get`, tên công ty bằng JWT tài khoản hệ thống, và **không còn gọi `fn_portal_account_set_password`** (tự liên kết làm trên server, chỉ sau khi mật khẩu đúng). Lỗi: `ma = KHONG_CO_TAI_KHOAN` → ô SĐT/CCCD; `SAI_MAT_KHAU` → `loginRejectMessage(errors)` ô mật khẩu. Dò công ty mới: `fn_portal_app_cong_ty_moi(token, công ty đã có)`; liên kết công ty mới: gọi lại `fn_portal_app_dang_nhap` bằng SĐT phiên + mật khẩu, chỉ giữ công ty mới, huỷ phiên thừa. Kết nối NOXH dùng `noxhSite` + `loginName` lưu trong phiên. Mô tả các bước bên dưới vẫn đúng về nghiệp vụ (nay là logic của hàm server). Giai đoạn 2 (đọc dữ liệu theo phiên) cũng đã xong — xem mục "App KHÔNG còn tài khoản hệ thống".

Một SĐT có thể là khách của **nhiều công ty** (mỗi công ty một hồ sơ `cloud_customers`). Khách chỉ nhập mật khẩu **một lần**, app đăng nhập ở mọi công ty.
1. Tìm mọi hồ sơ khách hàng theo SĐT, lấy tài khoản cổng của từng hồ sơ (`fn_portal_account_get`). Chia việc bằng `planCompanyLogins` (`lib/companySession.ts`):
   - công ty đã có tài khoản **đang hoạt động** → đăng nhập;
   - công ty **chưa có** tài khoản → tự liên kết (bước 3);
   - mỗi công ty tối đa một phiên; tài khoản **bị khoá** → bỏ qua công ty đó (không tự mở khoá, không tạo tài khoản thứ hai).
   - Không công ty nào có tài khoản → gợi ý "Đăng ký".
2. Gọi **`fn_portal_app_login(company_id, username, password)`** (anon) ở mọi công ty đã có tài khoản → `session_token` (7 ngày).
   - 2026-10-07: `fn_portal_login` cũ bị thu quyền anon (`20261008180300_revoke_fn_portal_login`, S-M10 — không khoá khi sai) → app báo `permission denied for function fn_portal_login`. Thay bằng `fn_portal_app_login` (`beeland/supabase/migrations/20261009160000_portal_app_login.sql`): cùng phạm vi tài khoản (TAT_CA, không tự đăng ký qua website, phiên không gắn website), **sai 5 lần → khoá 15 phút**, lỗi trả `{ error }`. Web không dùng hàm này.
   - Sai ở mọi công ty → "Số điện thoại hoặc mật khẩu không đúng". Công ty có mật khẩu khác (đăng ký riêng trước đây) → bỏ qua công ty đó.
3. **Tự liên kết** (chỉ khi mật khẩu đã đúng ở ít nhất một công ty): hồ sơ ở công ty chưa có tài khoản → `fn_portal_account_set_password` (username = SĐT chuẩn hoá, cùng mật khẩu) rồi `fn_portal_app_login`.
   - Ví dụ 2026-10-05: `0859021385` có hồ sơ ở **Công ty BRG** (KH-89348, đã có tài khoản) và **MSR** (KH-89349, thêm 05/10 sau khi đã có tài khoản BRG). Trước đây app chỉ thấy BRG. Nay lần đăng nhập tiếp theo tự tạo tài khoản MSR.
   - Một công ty lỗi không chặn đăng nhập các công ty khác; lần sau sẽ thử lại.
4. Phiên (`AuthSession`) giữ `companies`: phiên của từng công ty (token, tài khoản, hồ sơ khách, tên công ty từ `cloud_companies.ten_ct`). Các trường `token` / `companyId` / `customerId` / `user` là của **công ty đang xem**.
   - **1 công ty** → vào app luôn.
   - **Hồ sơ khách hàng (2026-10-08):** mỗi công ty 1 tài khoản; công ty có nhiều hồ sơ `cloud_customers` cùng SĐT vẫn 1 tài khoản. Sau khi có phiên, app gọi **`fn_portal_app_ho_so_list(token)`** (hồ sơ cùng công ty + cùng SĐT tài khoản) → `CompanySession.profiles`; phiên theo hồ sơ server đang xem (`dang_xem`). Lỗi (server chưa có hàm) → chỉ hồ sơ của tài khoản.
   - **1 hồ sơ** → vào app luôn. **Từ 2 hồ sơ** (mọi công ty) → modal **"Chọn hồ sơ khách hàng"** (`CompanyPickerDialog`, nhóm theo công ty, mỗi dòng "tên · mã KH · công ty").
   - Chọn hồ sơ → **`fn_portal_app_chon_ho_so(token, khach_hang_id)`** (server kiểm cùng công ty + cùng SĐT, ghi `cloud_portal_sessions.khach_hang_id`) rồi `withActiveCompany(session, companyId, customerId)`. `_portal_session` trả hồ sơ của phiên (không có thì của tài khoản) → yêu cầu, thanh toán online theo hồ sơ đang chọn; hợp đồng / thanh toán / phiếu thu / bàn giao app lọc theo `customerId`. Phiên web không đặt cột → web không đổi. Migration `beeland/supabase/migrations/20261009180000_portal_app_chon_ho_so.sql` (áp bằng `supabase_admin` — bảng phiên thuộc role này).
- **Chuyển hồ sơ**: tab Cá nhân → "Chuyển hồ sơ" (chỉ hiện khi có từ 2 hồ sơ) → cùng modal. `selectCompany` đổi phiên đang xem (`withActiveCompany`), xoá bộ nhớ đệm dữ liệu (`onSessionChange`) và dựng lại các tab (`key` theo công ty ở `app/(app)/_layout.tsx`) → hợp đồng, thanh toán, phiếu thu, thông báo của hồ sơ ở công ty mới.
- Mở lại app: nhớ công ty đang xem; kiểm tra token bằng `fn_portal_my_contracts`; hết hạn thì về màn đăng nhập. Phiên lưu trước 2026-10-05 (không có `companies`) vẫn dùng được, chỉ không có mục chuyển công ty tới lần đăng nhập sau.
- Đăng xuất: `fn_portal_logout(token)` cho phiên của **mọi** công ty.

**Hồ sơ phát sinh ở công ty mới khi khách đang đăng nhập** (`findNewCompanies` / `linkNewCompanies`, `LinkCompanyDialog`)
- Khách đã có tài khoản, sau đó nhân viên thêm hồ sơ cùng SĐT ở một công ty khác. App không lưu mật khẩu nên không tự tạo tài khoản được khi khách không nhập mật khẩu.
- **Dò (chỉ đọc):** khi mở app có phiên sẵn, và khi app quay lại từ nền (tối đa 30 phút một lần). Tra hồ sơ theo SĐT của phiên (`session.phone`, phiên cũ thì lấy SĐT hồ sơ), so với `session.companies` (`missingFromSession`).
- Có công ty mới → hộp thoại **"Có hồ sơ ở công ty mới"** (tên công ty, tên khách · mã KH) + ô **Mật khẩu hiện tại**:
  - **Liên kết:** xác minh mật khẩu bằng `fn_portal_login` ở công ty đang xem (phiên kiểm tra huỷ ngay), rồi tạo tài khoản ở công ty mới với **cùng mật khẩu** và đăng nhập, thêm vào danh sách công ty (`addCompanies`). Công ty đang xem giữ nguyên → Toast "Đã liên kết … Chuyển công ty trong mục Cá nhân". Sai mật khẩu → lỗi dưới ô.
  - **Để sau:** đóng; lần dò sau nhắc lại. Lần đăng nhập bằng mật khẩu kế tiếp cũng tự liên kết.
- **Hướng lâu dài (cần sửa server, chưa làm vì DB chỉ đọc):** khi nhân viên thêm khách có SĐT đã có tài khoản cổng, server tự tạo tài khoản ở công ty mới bằng `password_hash` sẵn có → app không phải hỏi lại mật khẩu.

## ⚠ Cần biết
- **OTP thật** (2026-10-08): server sinh, gửi và kiểm mã (mục Đăng ký / Quên mật khẩu ở trên). Thử thật cần SĐT có hồ sơ ở công ty đã cấu hình kênh ZNS/SMS (BRG có). Migration phải được áp lên server trước khi dùng bản app này.
- **App KHÔNG còn tài khoản hệ thống (2026-10-08):** đăng nhập (`fn_portal_app_dang_nhap`), dò/liên kết công ty mới, hồ sơ (`fn_portal_app_ho_so_list` / `_chon_ho_so`), hợp đồng / lịch thanh toán / phiếu thu / công ty bán / bàn giao (`fn_portal_app_hop_dong`, `_lich_tt`, `_phieu_thu`, `_cong_ty`, `_ban_giao`), website NOXH (`fn_portal_app_noxh_sites`) đều là hàm anon theo token phiên khách (`beeland/supabase/migrations/20261009170000…20261009200000`). Đã xoá `SERVICE_ACCOUNT`, `services/supabase/serviceAuth.ts`, `lib/serviceJwtCache.ts`; app xoá JWT cũ `beesky.serviceJwt` khỏi máy lúc mở. Việc còn lại phía người dùng: xoá biến `EXPO_PUBLIC_KH_SERVICE_*` khỏi `.env.local` + EAS, **đổi mật khẩu `beesky1/admin`** sau khi mọi người đã lên bản mới (bản cũ vẫn chứa tài khoản này).
- `AUTH_BACKEND = 'mock'` (`services/config.ts`) để chạy offline với dữ liệu giả: OTP giả `8888` (đăng ký + quên mật khẩu), demo `0901 234 567` / `123456` (khách của Sunshine Group, còn có hồ sơ BlueSky Land chưa liên kết → đăng nhập tự liên kết rồi hỏi chọn công ty).
- **Tự liên kết có ghi vào database** (tạo dòng `cloud_portal_accounts`, như bước đăng ký). Khi kiểm thử, chỉ đăng nhập bằng SĐT thử nghiệm.
- Hợp đồng, thanh toán, phiếu thu, thông báo đã nối dữ liệu thật, chỉ của khách đang đăng nhập: xem `docs/real-data.md`.

## Thông báo lỗi đăng nhập (2026-10-06)
- SĐT / CCCD không có tài khoản ở công ty nào → **"Số điện thoại / CCCD chưa có tài khoản. Vui lòng chọn "Đăng ký" để tạo tài khoản."** (dưới ô SĐT; `ACCOUNT_NOT_FOUND`).
- Có tài khoản nhưng mọi lần đăng nhập bị từ chối → **"Mật khẩu không đúng. Vui lòng thử lại hoặc chọn "Quên mật khẩu?"."** (dưới ô mật khẩu; `WRONG_PASSWORD`). App đã kiểm tra tài khoản tồn tại trước bước này nên câu chung của máy chủ ("Tên đăng nhập hoặc mật khẩu không đúng") nghĩa là sai mật khẩu. Riêng "Tài khoản tạm khoá, thử lại sau 15 phút" (sai 5 lần, `fn_portal_site_login`) và "Tài khoản không được dùng trên website này…" giữ nguyên câu máy chủ (`loginRejectMessage`, `lib/validation.ts`, test `tests/login-id.test.cjs`).
- Bấm "Đăng ký" / "Quên mật khẩu?" → xoá lỗi trước khi chuyển màn; đăng ký xong quay về (điền sẵn SĐT) → xoá lỗi + mật khẩu cũ.
