# Dữ liệu thật sau đăng nhập (hợp đồng, lịch thanh toán, phiếu thu, thông báo)

Cập nhật: 2026-10-02. Dùng chung database với web `beeland` và `beeland-app_2026`, theo đúng cách hai bên đang đọc. **Không sửa server.**

## ⛔ Chỉ dữ liệu của khách đang đăng nhập
- Lúc đăng nhập, server (`fn_portal_login`) trả `khach_hang_id` và `ma_ctdk` của tài khoản. Hai giá trị này được lưu trong phiên (`AuthSession.customerId` / `companyId`) và đưa vào `services/session.ts` (`setActiveSession`, do `AuthContext` gọi).
- Mọi truy vấn đi qua `requireCustomerScope()`. Không có phiên thì báo lỗi, **không bao giờ** truy vấn mà không lọc.
- Giao dịch chỉ đọc `cloud_pgc_phieu_giucho` với **`khach_hang_id = khách` VÀ `ma_ctdk_uid = công ty`**, rồi app lọc lại lần nữa phía client.
- Lịch thanh toán / phiếu thu / chi tiết chỉ gọi cho phiếu **nằm trong danh sách của khách** (`requireOwnedPgc`). Id của khách khác → "Không tìm thấy hợp đồng".
- Đổi hoặc thoát phiên → xoá bộ nhớ đệm (`onSessionChange` → `clearCustomerDataCache`).
- Đã thử trên dữ liệu thật 2026-10-02: id phiếu của 2 khách khác đều bị chặn; không có phiên thì không trả dữ liệu.

## Nguồn dữ liệu (`services/supabase/customerData.ts`, `customerDomain.ts`)

| App | Database | Giống |
|---|---|---|
| Danh sách hợp đồng / phiếu | `cloud_pgc_phieu_giucho` (lọc như trên, `deleted_at is null`) + tra `bds_products`, `da_projects`, `cloud_catalogs` theo id | 2026 `CustomerService.getCustomerTransactions` |
| Lịch thanh toán | RPC `fn_contract_payment_schedule(p_ma_ctdk_uid, p_pgc_id)`; rỗng → lịch lưu `lich_thanh_toan` trên phiếu + phân bổ `da_thu` lần lượt từng đợt, mỗi đợt hết gốc rồi tới PBT của đợt đó (2026-10-21; `da_thu` gộp gốc + PBT nên không tách được theo loại phiếu như máy chủ) | 2026 `PaymentProgressService.getSchedule`, web `ContractScheduleService` |
| Phiếu thu: đã trừ vào đâu | RPC `fn_portal_app_phieu_thu_phan_bo(p_token, p_pgc_id)` (migration web `20261028170000_portal_app_phieu_thu_phan_bo`, chỉ đọc) → `lib/receiptAllocation.ts`; chưa có hàm → bỏ qua | `fn_contract_payment_schedule` (CTE `ln`, `loai`, `alloc`) |
| Phiếu thu | RPC `fn_cash_vouchers_by_pgc(…, 'THU')`, tiền = `so_tien_pgc` | 2026 `getReceipts`, web `PgcCashVouchersTab` |
| Ảnh dự án | `cloud_catalogs` loại `du_an_anh` (`item_code = da_projects.ma_da_code`, `ma_ctdk_uid` = công ty) → `anh_background` → `anh_icon`; không có thì `da_projects.image_url`. Đường dẫn `upload/...` thêm tiền tố `https://upload.beesky.vn/` | 2026 `ProjectService` (`fetchDuAnAnhMap`, `absUrl`) |
| Bên bán | `cloud_companies` (`ten_ct`, `dia_chi`, `dien_thoai`, `email`) của công ty tài khoản | |
| Thông báo | Tạo trong app từ lịch + phiếu thu của khách (`lib/notification.buildPaymentNotifications`); đã đọc lưu trên máy theo tài khoản | Server chưa có bảng thông báo cho khách. 2026 dùng API .NET dành cho nhân viên |

Bộ nhớ đệm 20 giây để Trang chủ / Hợp đồng / Thanh toán không gọi trùng. Kéo để làm mới → đọc lại từ server.

## Bàn giao căn hộ & lịch nhận nhà (`services/supabase/handover.ts`, `services/handoverService.ts`, `lib/handover.ts`, test `tests/handover.test.cjs` + `tests/customer-data-api.test.cjs`) — gộp 2026-10-16

Máy chủ: beeland migration `20261017100000_portal_bg_dang_ky` (spec `docs/superpowers/specs/2026-10-16-ban-giao-dang-ky-lich-design.md`). Màn "Lịch bàn giao" cũ (`/lich-ban-giao`) chuyển hướng về `/ban-giao`.

| App | Database (token phiên khách, anon) | Giống web |
|---|---|---|
| Bàn giao căn hộ | `fn_portal_app_ban_giao` → `quy` (`bee_handover_funds` của các phiếu thuộc hồ sơ); app ghép lại theo `khach_hang_id` + hợp đồng của khách (`ownedHandovers`) | Hợp đồng › Bàn giao › Quỹ bàn giao |
| Lịch nhận nhà | cùng hàm → `lich` = `_bg_lich_khach` (`bg_lich_hen`, đã lọc đúng khách, bỏ lịch `HUY`): ngày, ca, địa điểm, người phụ trách + SĐT, số tiền cần nộp, biên bản đã ký, `khach_dang_ky` | Lịch bàn giao |
| Ca còn chỗ | `fn_portal_app_bg_ca(p_token, p_ban_giao_id)` — mọi ngày trong khoảng đăng ký, hôm nay bỏ ca đã bắt đầu | Ca ký (`cloud_signing_shifts`) |
| **Đăng ký / đổi / huỷ (GHI)** | `fn_portal_app_bg_dang_ky(p_token, p_ban_giao_id, p_ngay, p_ca_id)` · `fn_portal_app_bg_doi(p_token, p_lich_id, p_ngay, p_ca_id)` · `fn_portal_app_bg_huy(p_token, p_lich_id)` — lỗi trả `{error}` tiếng Việt (app hiện nguyên văn) | Nhân viên thấy nhãn "Khách tự đăng ký", xác nhận như lịch thường |
| Hotline | `cloud_companies.dien_thoai` của công ty | |

- **Khoảng đăng ký** = `[max(hôm nay, tu_ngay), den_ngay]` giờ VN (tối đa 92 ngày), mọi ngày trong tuần; chỉ quỹ `PENDING` / `NOTIFIED` chưa có lịch hiệu lực (`CHO_XAC_NHAN` / `DA_XAC_NHAN` / `DANG_BAN_GIAO`). Sức chứa theo `so_khach` của ca (`_bg_kiem_ca`, khoá advisory).
- Lịch khách tạo: `CHO_XAC_NHAN`, `khach_dang_ky = true`, chưa địa điểm / nhân viên. Khách chỉ đổi / huỷ lịch **do mình đặt**, còn chờ xác nhận, chưa qua ngày; lịch nhân viên xếp hoặc đã xác nhận → nút gọi SĐT phụ trách / hotline.
- Khối "Lịch nhận nhà" theo `appointmentState`: tạm dừng > đã bàn giao > lịch hiệu lực (chờ / đã xác nhận) > chưa có khoảng / được chọn lịch / quá hạn. Căn đang chờ chọn lịch lên đầu danh sách.
- **Tiến độ trên thẻ bàn giao tính từ lịch thanh toán thật** (`fn_contract_payment_schedule`: đã thu / phải thu gốc, PBT riêng; không có lịch → % đã trả của hợp đồng). KHÔNG dùng `pt_tien_do` / `pt_tien_do_pbt` của quỹ — đó là ô nhân viên gõ tay trên web ("% Tiến độ", mặc định 0).
- Trạng thái quỹ (`state`): PENDING Chờ bàn giao · NOTIFIED Đã thông báo · HANDING_OVER Đang bàn giao · HANDED_OVER Đã bàn giao · PAUSED Tạm dừng; lạ → Chờ bàn giao. Trạng thái lịch (mã): CHO_XAC_NHAN vàng · DA_XAC_NHAN / DANG_BAN_GIAO xanh · DA_BAN_GIAO xanh lá · VANG_MAT / HOAN đỏ.
- Trước 2026-10-16 app đọc bảng chữ cũ `bee_handover_schedules` (đã bỏ) nên khách thật luôn thấy lịch trống — nay đọc `bg_lich_hen`.

## Yêu cầu khách hàng (`services/requestService.ts`, `lib/requests.ts`, test `tests/requests.test.cjs`) — 2026-10-06
- Cùng luồng web khách hàng (`beeland/docs-claude/08-features/customer-requests.md`): token phiên cổng khách hàng của công ty đang xem (`requirePortalToken`: phiên hợp đồng, không có thì phiên NOXH) → `fn_portal_request_options` (loại + hợp đồng của khách), `fn_portal_my_requests` (yêu cầu + lịch sử, không có ghi chú nội bộ), `fn_portal_request_create` (**ghi** `cloud_customer_requests` + 1 dòng log khi KHÁCH bấm "Gửi yêu cầu" — người dùng duyệt 2026-10-06; Claude không tự gọi).
- Tệp: edge `portal-request-files` `upload-url {token, ten, size, type}` → `uploadToSignedUrl('drive-files', path, token)` → gửi `drive-files:<path>`; `download-url {token, path}` → link 10 phút.
- Máy chủ: tiêu đề 3–300, nội dung ≤ 5000, ≤ 5 tệp 10 MB, 10 yêu cầu / khách / 24 giờ; nguồn tự gán "website/portal", trạng thái "Mới", số phiếu `YEUCAU`.
- **Triển khai:** đã chạy 0141 + 0142 và deploy edge `portal-request-files` trên self-host ngày 2026-10-06 (kiểm bằng token giả: RPC và edge trả "Phiên đăng nhập đã hết hạn…"). Nếu máy chủ thiếu hàm (PGRST202) app báo "Tính năng gửi yêu cầu chưa được bật trên máy chủ…" (`requestErrorMessage`).

## Ánh xạ (`lib/portalMapping.ts`, test `tests/portal-mapping.test.cjs`)
- **Loại:** `giai_doan` HDMB / HDGV / THANHLY → HĐ mua bán; DATCOC → đặt cọc; GIUCHO → phiếu giữ chỗ.
- **Trạng thái** (`cloud_catalogs` `pgc_trang_thai`, `item_code`):
  - 11, 16 → đã hủy;
  - 19, 21 → đã tất toán;
  - 6, 13, 14, 15, 17, 18, 22 → đang hiệu lực;
  - còn lại (chờ duyệt) → chờ xử lý.
  - Badge hiển thị **tên gốc** trên server (`Contract.statusLabel`, vd "HĐMB chờ duyệt").
- **Mã HĐ** = `tt_hop_dong.SoPhieu` → `so_phieu_gc` → mã căn.
- **Căn** = `bds_products.ky_hieu`; toà / tầng tách từ mã căn (`A1-1107` → A1, tầng 11; `A1-12A01` → tầng 12).
- **Giá trị** = `gia_tri_hd_sau_ck ?? gia_tri_hd ?? tien_coc`.
- **Ngày ký** = `tt_hop_dong.NgayKy` → `ngay_giu_cho` → `created_at`.
- **Tư vấn** = `tt_hop_dong.TenNVKD`.
- **Đợt thanh toán** = phải thu gốc + phí bảo trì của đợt; đã trả = đã thu gốc + đã thu PBT (tổng các đợt khớp giá trị HĐ gồm PBT).
  - Phiếu chưa có lịch: "đã trả" = cột `da_thu`.
- Tổng quan Trang chủ không cộng phiếu đã hủy / thanh lý.

## Chưa có trên database → app ẩn hoặc báo "sắp ra mắt"
- Tệp hợp đồng PDF: ẩn dòng "Xem hợp đồng (PDF)".
- Điều khoản chính: ẩn khối.
- Người đại diện / mã số thuế bên bán: ẩn dòng.
- ~~Thanh toán trực tuyến: báo "đang tích hợp".~~ → 2026-10-07: thanh toán QR, xem mục dưới.
- **Phiếu thu PDF (2026-10-06):** dựng ngay trên máy từ dữ liệu phiếu (`lib/receiptPdf.ts`, Mẫu 01-TT như web `printReceiptTT200`, số tiền bằng chữ như web `numberToVietnameseWords`; đơn vị = `cloud_companies` của tài khoản) — `expo-print` + `expo-sharing` + `expo-file-system` (có trong Expo Go). Tải PDF: Android hộp in → "Lưu dưới dạng PDF", iOS bảng chia sẻ "Lưu vào Tệp", web hộp in "Lưu thành PDF". Chia sẻ: tệp `PhieuThu_<số>.pdf`; web dùng chia sẻ trình duyệt hoặc sao chép thông tin. Phiếu ghi rõ là bản điện tử tra cứu (database chưa có tệp phiếu ký số).
- Thu ngân trên phiếu thu: để trống.

## Chạy offline
`AUTH_BACKEND = 'mock'` (`services/config.ts`) → toàn bộ app dùng dữ liệu `data/mock/` như trước.

## Giao diện thẻ hợp đồng (2026-10-02)
- Ảnh thật của dự án tràn đầu thẻ (cao `sizes.projectImage` = 184), phủ gradient `overlay.imageScrimTop` → `imageScrimBottom` (xanh đêm 84%).
  - Trên ảnh: viên kính loại hợp đồng (`overlay.glassOnImage`) và badge trạng thái ở trên; tên dự án và "Căn · toà · tầng" màu trắng ở dưới.
  - Tương phản chữ trắng đã có trong `npm test`.
- Thân thẻ:
  - Mã hợp đồng (nhãn nhỏ, chữ 15 không ngắt giữa chừng) + ngày ký;
  - khối tiến độ nền nhạt: % lớn, thanh tiến độ, Đã trả / Còn lại, Giá trị HĐ;
  - **đợt tiếp theo** (tên đợt, số tiền còn, hạn, "Còn N ngày"), nền đỏ nhạt nếu quá hạn.
- Chưa có ảnh / ảnh lỗi → gradient xanh trời + icon toà nhà (bỏ ảnh minh hoạ cam cũ).
- Chi tiết hợp đồng: ảnh có tên dự án + căn đè lên; thân thẻ thêm "Chuyên viên tư vấn".

## Thanh toán QR — tài khoản định danh (2026-10-07)
Cùng luồng web booking / đặt cọc (`beeland/docs/payment-flow.md`, `BookingVAQRDialog`), nhưng xác thực bằng **token phiên của khách** và **máy chủ tự tính số tiền**. Spec: `docs/superpowers/specs/2026-10-07-kh-app-payment-design.md`.

| Phiếu | Module VA | Số tiền | Hạn |
|---|---|---|---|
| HĐMB / HĐGV chưa thanh lý (≠ 11, 12, 16) | HOPDONG | đợt kế tiếp: gốc + PBT − đã thu (`fn_contract_payment_schedule`) | không |
| Đặt cọc chờ duyệt (8) | DATCOC | `tien_coc − da_thu` | không |
| Giữ chỗ chờ duyệt (1) | BOOKING | `cloud_bookings.tien_giu_cho` (→ `cloud_sales_settings.tien_booking`) | `het_han_luc` (→ mốc + `thoi_gian_booking`) |

- App: `payTarget` (`lib/paymentTarget.recordPayTarget`, cùng quy tắc) → nút Thanh toán ở Chi tiết hợp đồng → `PaymentConfirmDialog` → màn `/pay` (`usePaymentCheckout`): edge `portal-payment` `start` → VietQR → hỏi `fn_portal_payment_status` mỗi 5 giây; số tiền VA nhận **tăng** = đã thanh toán.
- Máy chủ (`beeland/supabase/migrations/20261009160100_portal_payment.sql`, `beeland/supabase/functions/portal-payment`, triển khai: `beeland/scripts/deploy-portal-payment.sh`): dùng lại VA đang hoạt động (HOPDONG: mọi VA HOPDONG, kể cả nhân viên tạo — QR ghi số tiền của đợt như in thông báo; BOOKING/DATCOC: cùng số tiền, lệch thì xoá rồi tạo lại), chưa có thì **chỉ tự tạo khi dự án có đúng 1 tài khoản cấu hình** (`get-cauhinhnh`) — `create-bill` với tài khoản đó, loại thu "Thu theo tiến độ" (đặt cọc "Thu tiền cọc" như web), số tiền tạo: HĐ = giá trị HĐ (`gia_tri_hd`, như web `CreateVirtualAccountDialog`), booking/cọc = khoản cần thu; **nhiều (hoặc không có) tài khoản cấu hình → chặn**: "… chưa có tài khoản thanh toán. Vui lòng chờ ban quản lý tạo tài khoản định danh rồi thử lại." (người dùng chốt 2026-10-07). Tối đa 5 VA / phiếu / 24 giờ; người tạo `Khách hàng (app)`.
- Không sửa `payment-gateway` / webhook: webhook có sẵn tạo phiếu thu + tự duyệt booking / đặt cọc; cron xoá VA booking hết hạn.
- BRG Smart City có 2 tài khoản cấu hình (MaTK 43, 44) → app chỉ dùng VA nhân viên đã tạo; BRG TOWER chưa cấu hình thanh toán (`da_payment_gateway_configs`) → "Dự án chưa bật thanh toán trực tuyến" (web cũng không tạo được).
- ⚠ Bấm "Xác nhận thanh toán" trên dữ liệu thật **có thể tạo tài khoản định danh thật** ở ngân hàng (ghi `contract_virtual_accounts`). Claude không tự bấm thử.
- Đã thử (2026-10-07, `BEGIN…ROLLBACK`): A1-1005 Đợt 1 = 155.417.983, Đợt 2 = 331.061.508 (khớp app); đặt cọc DC-A1-1001 = 200.000.000; phiếu của khách khác → "Không tìm thấy hợp đồng"; token giả → "Phiên đăng nhập đã hết hạn".

## Thông báo tin nhắn (banner + push) — 2026-10-13

Máy chủ: beeland migration `20261013150000_chat_push` + edge `chat-push` (spec `beeland/docs/superpowers/specs/2026-10-13-chat-push-design.md`).

- **Đăng ký** (`services/pushService.ts`): đăng nhập / đổi công ty / quay lại app → xin quyền (lần đầu) → Expo push token →
  `fn_portal_app_push_dang_ky(token phiên cổng của MỌI công ty, …)` — máy nhận tin của hồ sơ đang chọn ở từng công ty, hết hạn
  theo phiên. Đăng xuất → `fn_portal_app_push_huy` (AuthContext `signOut`, trước khi huỷ phiên). Bản xem thử (`mock`) / web: bỏ qua.
- **Push** khi nhân viên trả lời (tiêu đề = tên công ty, "Tên NV: nội dung"); tin của chính khách không báo.
- **Banner trong app** (`components/layout/ChatNotifier.tsx`, gắn ở `app/_layout.tsx` khi đã đăng nhập): realtime `chatv:` của
  công ty đang xem (`new` → tải tin cuối) + push nhận lúc đang mở (ẩn thông báo hệ thống). Khử trùng theo id tin; không hiện khi
  đang ở màn Nhắn tin của công ty đó; tự ẩn 4,5 s. Logic thuần: `lib/chatNotify.ts` (test `tests/chat-notify.test.cjs`).
- **Bấm banner / push** → chuyển công ty / hồ sơ nếu push thuộc công ty khác (`selectCompany`) rồi mở `/tin-nhan`.
- Bản build **1.1** (native module + plugin `expo-notifications`). Android cần `google-services.json` + khoá FCM V1 trên EAS.
