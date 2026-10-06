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
| Lịch thanh toán | RPC `fn_contract_payment_schedule(p_ma_ctdk_uid, p_pgc_id)`; rỗng → lịch lưu `lich_thanh_toan` trên phiếu + phân bổ `da_thu` (hết gốc từng đợt rồi mới PBT) | 2026 `PaymentProgressService.getSchedule`, web `ContractScheduleService` |
| Phiếu thu | RPC `fn_cash_vouchers_by_pgc(…, 'THU')`, tiền = `so_tien_pgc` | 2026 `getReceipts`, web `PgcCashVouchersTab` |
| Ảnh dự án | `cloud_catalogs` loại `du_an_anh` (`item_code = da_projects.ma_da_code`, `ma_ctdk_uid` = công ty) → `anh_background` → `anh_icon`; không có thì `da_projects.image_url`. Đường dẫn `upload/...` thêm tiền tố `https://upload.beesky.vn/` | 2026 `ProjectService` (`fetchDuAnAnhMap`, `absUrl`) |
| Bên bán | `cloud_companies` (`ten_ct`, `dia_chi`, `dien_thoai`, `email`) của công ty tài khoản | |
| Thông báo | Tạo trong app từ lịch + phiếu thu của khách (`lib/notification.buildPaymentNotifications`); đã đọc lưu trên máy theo tài khoản | Server chưa có bảng thông báo cho khách. 2026 dùng API .NET dành cho nhân viên |

Bộ nhớ đệm 20 giây để Trang chủ / Hợp đồng / Thanh toán không gọi trùng. Kéo để làm mới → đọc lại từ server.

## Bàn giao căn hộ & lịch bàn giao (`services/supabase/handover.ts`, `lib/handover.ts`, test `tests/handover.test.cjs`) — 2026-10-05, CHỈ ĐỌC
| App | Database | Giống web |
|---|---|---|
| Bàn giao căn hộ | RPC `fn_handover_fund_list` (bảng `bee_handover_funds`): tìm theo `di_dong` của khách (không có thì theo từng mã căn), **chỉ giữ dòng `khach_hang_id` = khách VÀ `phieu_giu_cho_id` thuộc hợp đồng của khách** | `HandoverFundService.list` (Hợp đồng › Bàn giao › Quỹ bàn giao) |
| Lịch bàn giao | `bee_handover_schedules` lọc `ma_ctdk_uid` = công ty + `so_hdmb` / `ma_sp` của khách; lịch lưu chữ, không có khoá khách → ghép lại: **trùng số HĐMB, hoặc trùng mã căn VÀ SĐT** (mã căn một mình không đủ) | `HandoverScheduleCloud` (Lịch bàn giao) |
| Hotline đổi lịch | `cloud_companies.dien_thoai` của công ty | |

- **Tiến độ trên thẻ bàn giao tính từ lịch thanh toán thật** (`fn_contract_payment_schedule`: đã thu / phải thu gốc, PBT riêng; không có lịch → % đã trả của hợp đồng). KHÔNG dùng `pt_tien_do` / `pt_tien_do_pbt` của quỹ — đó là ô nhân viên gõ tay trên web ("% Tiến độ", mặc định 0). Ví dụ QBG-2026-0001 gõ 100% nhưng khách mới trả 4.000 / 8.695.815.474 đ.
- Trạng thái quỹ (`state`): PENDING Chờ bàn giao · NOTIFIED Đã thông báo · HANDING_OVER Đang bàn giao · HANDED_OVER Đã bàn giao · PAUSED Tạm dừng; lạ → Chờ bàn giao.
- Trạng thái lịch (`trang_thai`, chữ): Chờ xác nhận · Đã xác nhận · Đã bàn giao · Hoãn lịch; badge hiện nhãn gốc. Ngày `ngay_ban_giao` (timestamptz) đổi sang ngày giờ VN.
- Lưu ý dữ liệu: màn Lịch bàn giao trên web **tự chèn dữ liệu mẫu** khi công ty chưa có lịch (60 dòng hiện tại là mẫu, SĐT 092…) → khách thật chưa thấy lịch nào cho tới khi nhân viên nhập lịch với đúng số HĐMB.
- Đã thử trên dữ liệu thật 2026-10-05: khách 0859021385 nhận đúng QBG-2026-0001 (A1-1103, Đã bàn giao); lịch: truy vấn hợp lệ, 0 dòng.

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
- Thanh toán trực tuyến: báo "đang tích hợp".
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
