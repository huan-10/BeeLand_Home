# Database thật (api-beelandv2.beesky.vn)

> ## ⛔ CHỈ ĐƯỢC PHÉP ĐỌC
> Với database / API `https://api-beelandv2.beesky.vn`, **tuyệt đối không thêm, sửa hay xoá dữ liệu**. Quy tắc này áp dụng cho cả người lẫn AI.
> Server **không có môi trường test**: mọi thao tác ghi đều đi thẳng vào dữ liệu thật của khách hàng.

## Được phép
- `GET /rest/v1/<bảng>?select=…&limit=…`: đọc bảng, luôn kèm `limit` nhỏ.
- `GET /rest/v1/`: đọc schema (OpenAPI của PostgREST).
- `POST /rest/v1/rpc/fn_*` **chỉ với hàm đọc** (`*_list`, `*_lookup`, `*_get*`, `*_schedule`…). Trước khi gọi phải đọc định nghĩa hàm để chắc nó không ghi.
- `POST /functions/v1/cloud-auth` với `action: "login"` để lấy JWT chỉ đọc.
  - Lưu ý: lúc đăng nhập, server có thể tự nâng cấp mã băm mật khẩu của chính tài khoản đó. Đây là hành vi của server, không phải thao tác ghi dữ liệu nghiệp vụ.

## Cấm
- `POST` / `PATCH` / `PUT` / `DELETE` vào `/rest/v1/<bảng>`.
- Mọi RPC ghi: `fn_*_create`, `fn_*_update`, `fn_*_set`, `fn_*_delete`, `fn_*_success`, `fn_*_approve`…
- Mọi action ghi của edge function: `cloud-auth` (`mirror`, `set-password`, `sync-perm`…), `customer-web-password` (`set`), `payment-gateway`, `upload-file`, `storage-broker`…
- Sửa hàm SQL, migration, trigger, RLS, bảng.

Không chắc một lệnh có ghi hay không → **không chạy**, hỏi lại người phụ trách.

## Tài khoản
- Tài khoản chỉ đọc lưu trong `.env.local`, file này không commit (`.env*.local` đã nằm trong `.gitignore`):
  - `BEELAND_READONLY_USER`, `BEELAND_READONLY_PASSWORD`: tài khoản **SSH** vào server `BEELAND_SSH_HOST`. Tài khoản này có quyền docker/sudo, nên chỉ được chạy lệnh đọc.
  - Không chép mật khẩu vào tài liệu hay code.
- Không dùng `service_role` key.

## Tham khảo
- Header, JWT, quy tắc tenant (uuid hay mã chữ) theo từng bảng: `../beeland-app_2026/docs/data-access.md`.
- Cổng khách hàng trên web: `../beeland/src/pages/CustomerPortal/*`, edge function `../beeland/supabase/functions/customer-web-password`.

## Đăng ký / đăng nhập khách hàng
Khi khách dùng app, app tự gọi các hàm có sẵn (`fn_portal_account_set_password`, `fn_portal_login`, `fn_portal_logout`) và các hàm này **ghi dữ liệu thật**. Đó là chức năng của app, người dùng đã đồng ý ngày 2026-10-02. Lúc phát triển, Claude **không** tự gọi các hàm ghi này để thử; người phụ trách tự bấm thử trên app. Chi tiết: `docs/auth-flow.md`.

## Nhà ở xã hội (2026-10-05)
App gọi các hàm ghi của cổng NOXH khi khách thao tác: `fn_portal_noxh_ho_so_save` (lưu nháp / nộp), `fn_portal_noxh_ho_so_delete`, `fn_portal_noxh_ho_so_gui_bo_sung`, `fn_portal_noxh_file_attach` + edge `portal-noxh` (`upload-url`) + tải tệp lên bucket `drive-files`, `fn_portal_noxh_boc_tham_quay`, `fn_portal_noxh_thong_bao_da_doc`, `fn_portal_noxh_cap_nhat_cccd` (khách tự khai CCCD — cần migration `beeland/supabase/migrations/20261005200000_portal_account_cccd.sql` đã deploy; hàm đọc kèm theo: `fn_portal_noxh_tai_khoan`), và `fn_portal_site_login` (tạo phiên). Đó là chức năng của app, người dùng đồng ý ngày 2026-10-05 (giống đăng nhập/đăng ký ngày 02/10). Lúc phát triển, Claude **không** tự gọi các hàm này; người phụ trách tự bấm thử trên app bằng tài khoản thử nghiệm. Hàm đọc đã kiểm (`STABLE`, không ghi): `fn_portal_noxh_dot_list`, `fn_portal_noxh_dot_get`, `fn_portal_noxh_loai_can`, `fn_portal_noxh_boc_tham_cong_bo`.
