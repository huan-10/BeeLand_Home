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

**Đăng ký** (`app/register.tsx` → `startRegistration` / `confirmRegistration`)
1. **Bước 1:** khách nhập SĐT và mật khẩu.
   - App đọc `cloud_customers` với `dien_thoai` trùng SĐT (dùng LIKE `*3*3*9*…` rồi lọc lại bằng `normalizePhone`).
   - Với từng hồ sơ, gọi `fn_portal_account_get(ma_ctdk, id)` để biết đã có tài khoản chưa.
   - Không có hồ sơ → "chưa có trong hệ thống khách hàng".
   - **Đã có tài khoản đang hoạt động ở bất kỳ công ty nào** → chặn: "Số điện thoại đã có tài khoản. Vui lòng đăng nhập — hồ sơ ở công ty mới sẽ được tự liên kết." (từ 2026-10-05; trước đó app cho đăng ký thêm công ty mới với mật khẩu khác → mỗi công ty một mật khẩu).
   - Chỉ có tài khoản bị khoá, không còn hồ sơ nào để tạo → "Tài khoản … đang bị khoá. Vui lòng liên hệ chủ đầu tư".
   - Hợp lệ → sang bước OTP.
2. **Bước 2:** nhập OTP đúng → với mỗi hồ sơ chưa có tài khoản, gọi **`fn_portal_account_set_password(ma_ctdk, khach_hang_id, password, username = SĐT chuẩn hoá)`**.
   - Đây là hàm có sẵn mà nhân viên dùng trên web. Nó tạo dòng `cloud_portal_accounts` với mật khẩu băm bcrypt trên server.
   - Xong → về màn Đăng nhập, điền sẵn SĐT.

**Đăng nhập** (`app/login.tsx` → `login` → `apiLogin`)

Một SĐT có thể là khách của **nhiều công ty** (mỗi công ty một hồ sơ `cloud_customers`). Khách chỉ nhập mật khẩu **một lần**, app đăng nhập ở mọi công ty.
1. Tìm mọi hồ sơ khách hàng theo SĐT, lấy tài khoản cổng của từng hồ sơ (`fn_portal_account_get`). Chia việc bằng `planCompanyLogins` (`lib/companySession.ts`):
   - công ty đã có tài khoản **đang hoạt động** → đăng nhập;
   - công ty **chưa có** tài khoản → tự liên kết (bước 3);
   - mỗi công ty tối đa một phiên; tài khoản **bị khoá** → bỏ qua công ty đó (không tự mở khoá, không tạo tài khoản thứ hai).
   - Không công ty nào có tài khoản → gợi ý "Đăng ký".
2. Gọi **`fn_portal_login(company_id, username, password)`** (anon, giống web) ở mọi công ty đã có tài khoản → `session_token` (7 ngày).
   - Sai ở mọi công ty → "Số điện thoại hoặc mật khẩu không đúng". Công ty có mật khẩu khác (đăng ký riêng trước đây) → bỏ qua công ty đó.
3. **Tự liên kết** (chỉ khi mật khẩu đã đúng ở ít nhất một công ty): hồ sơ ở công ty chưa có tài khoản → `fn_portal_account_set_password` (username = SĐT chuẩn hoá, cùng mật khẩu) rồi `fn_portal_login`.
   - Ví dụ 2026-10-05: `0859021385` có hồ sơ ở **Công ty BRG** (KH-89348, đã có tài khoản) và **MSR** (KH-89349, thêm 05/10 sau khi đã có tài khoản BRG). Trước đây app chỉ thấy BRG. Nay lần đăng nhập tiếp theo tự tạo tài khoản MSR.
   - Một công ty lỗi không chặn đăng nhập các công ty khác; lần sau sẽ thử lại.
4. Phiên (`AuthSession`) giữ `companies`: phiên của từng công ty (token, tài khoản, hồ sơ khách, tên công ty từ `cloud_companies.ten_ct`). Các trường `token` / `companyId` / `customerId` / `user` là của **công ty đang xem**.
   - **1 công ty** → vào app luôn.
   - **Từ 2 công ty** → modal **"Chọn công ty"** (`CompanyPickerDialog`), chọn xong vào app ngay, không gọi server thêm.
- **Chuyển công ty**: tab Cá nhân → "Chuyển công ty" (chỉ hiện khi có từ 2 công ty) → cùng modal. `selectCompany` đổi phiên đang xem (`withActiveCompany`), xoá bộ nhớ đệm dữ liệu (`onSessionChange`) và dựng lại các tab (`key` theo công ty ở `app/(app)/_layout.tsx`) → hợp đồng, thanh toán, phiếu thu, thông báo của hồ sơ ở công ty mới.
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
- **OTP tạm thời cố định `8888`**, sinh và kiểm ngay trong app (giống cách rork làm), chưa gửi Zalo. TODO trong `services/authService.ts` (`TEMP_OTP`).
- **Tài khoản hệ thống nằm trong app:** biến `EXPO_PUBLIC_*` được đóng gói vào bản build, ai giải nén app cũng đọc được.
  - Nên dùng một tài khoản riêng, quyền tối thiểu, đổi mật khẩu định kỳ.
  - Hướng an toàn lâu dài: edge function `portal-auth` + migration đã viết sẵn trong `../beeland` (`supabase/functions/portal-auth`, `supabase/migrations/20261002120000_portal_phone_register.sql`). Hai file này chưa deploy và hiện không dùng.
  - Khi chuyển sang hướng đó, OTP cũng do server kiểm.
- `AUTH_BACKEND = 'mock'` (`services/config.ts`) để chạy offline với dữ liệu giả: OTP `8888`, demo `0901 234 567` / `123456` (khách của Sunshine Group, còn có hồ sơ BlueSky Land chưa liên kết → đăng nhập tự liên kết rồi hỏi chọn công ty).
- **Tự liên kết có ghi vào database** (tạo dòng `cloud_portal_accounts`, như bước đăng ký). Khi kiểm thử, chỉ đăng nhập bằng SĐT thử nghiệm.
- Hợp đồng, thanh toán, phiếu thu, thông báo đã nối dữ liệu thật, chỉ của khách đang đăng nhập: xem `docs/real-data.md`.
