# Khách tự đăng ký lịch nhận nhà — gộp "Bàn giao căn hộ" + "Lịch bàn giao" (app khách) — thiết kế

Ngày: 2026-10-16 · Trạng thái: đã duyệt thiết kế (3 phần), chờ duyệt spec · Liên quan web: `beeland/docs-claude/07-workflows/ban-giao-quyet-toan.md` (Quỹ bàn giao, Lịch hẹn & biên bản bàn giao).

## 1. Mục tiêu

Khách biết **khoảng thời gian bàn giao** căn của mình (quỹ bàn giao `tu_ngay → den_ngay`) và **tự chọn ngày + ca** nhận nhà trong khoảng đó ngay trên app. Lịch khách đăng ký ghi thẳng vào lịch hẹn bàn giao của web (`bg_lich_hen`), nhân viên xử lý tiếp như lịch do nhân viên xếp ⇒ web và app luôn cùng một dữ liệu. Trên app, hai màn "Bàn giao căn hộ" và "Lịch bàn giao" gộp làm một.

Thành công khi: khách có quỹ đang chờ bàn giao thấy khoảng ngày + số ngày còn để chọn → chọn ngày còn chỗ → chọn ca → đăng ký; nhân viên thấy lịch "Chờ xác nhận — Khách tự đăng ký" trên web; khách đổi / huỷ được khi còn chờ xác nhận; sau khi nhân viên xác nhận, khách thấy địa điểm, người phụ trách, số tiền cần nộp trước buổi nhận.

## 2. Quyết định đã chốt (người dùng 2026-10-16)

| Mã | Câu hỏi | Quyết định |
|---|---|---|
| KD1 | Trạng thái lịch khách vừa đăng ký | **Chờ xác nhận** (`CHO_XAC_NHAN`); nhân viên xác nhận trên web, bổ sung địa điểm / người phụ trách rồi gửi thông báo như hiện nay |
| KD2 | Khách tự đổi / huỷ | **Chỉ khi lịch do khách đặt và còn `CHO_XAC_NHAN`**, chưa qua ngày hẹn. Đã xác nhận ⇒ gọi hotline |
| KD3 | Ngày sớm nhất | **Từ hôm nay** (giờ VN). Riêng hôm nay ẩn ca đã bắt đầu (bổ sung của thiết kế) |
| KD4 | Ngày trong tuần | **Mọi ngày** (ca làm việc chưa cấu hình theo thứ) |
| KD5 | Cách làm | **Phương án A**: hàm máy chủ mới `fn_portal_app_bg_*` theo token phiên khách; chỉ THÊM, không đổi hàm nhân viên. Người dùng cấp quyền ghi máy chủ cho việc này (2026-10-16) |

## 3. Hiện trạng (đọc 2026-10-16)

- Web: chỉ nhân viên xếp lịch (`fn_bg_xep_lich`, form 813), theo ca `cloud_signing_shifts` (thủ tục `BAN_GIAO` hoặc ca dùng chung) có sức chứa `so_khach`; `_bg_kiem_ca` kiểm ca + sức chứa có khoá advisory; mỗi quỹ tối đa 1 lịch hiệu lực (`CHO_XAC_NHAN`/`DA_XAC_NHAN`/`DANG_BAN_GIAO`); quỹ xếp được khi `PENDING`/`NOTIFIED`.
- App khách: `fn_portal_app_ban_giao(p_token)` trả `quy` (có `tu_ngay`, `den_ngay` — timestamptz) + `lich` (`_bg_lich_khach`: `id, ban_giao_id, so_qbg, ky_hieu, lan, ngay, ca, tu_gio, den_gio, dia_diem, trang_thai, trang_thai_ten, nhan_vien, lien_he, so_tien_can_nop, bien_ban`).
- **Lỗi sẵn có:** app (`lib/handover.ts` `ScheduleRow`/`matchSchedules`, `services/supabase/handover.ts`) vẫn đọc lịch theo bảng cũ `bee_handover_schedules` (`so_hdmb`, `ngay_ban_giao`, `trang_thai` chữ, lọc `ma_ctdk_uid`) — bảng đã xoá, server trả cấu trúc mới ⇒ mọi lịch thật bị lọc mất, khách luôn thấy danh sách trống. Thiết kế này thay toàn bộ phần đọc lịch.
- Dữ liệu thật: 10 quỹ (đều có khoảng ngày), 7 lịch; ca 08:00–10:00, 10:00–12:00, 13:30–15:30, 15:30–17:30, sức chứa 5–20.

## 4. Máy chủ (migration ở repo web `beeland/supabase/migrations/20261016*`)

Mọi hàm mới: `SECURITY DEFINER`, `search_path public`, công ty + khách lấy từ `_portal_app_ctx(p_token)` (token hết hạn ⇒ `{error:'Phiên đăng nhập đã hết hạn…'}`), chỉ thao tác quỹ có `cloud_pgc_phieu_giucho.khach_hang_id` = khách của phiên, cùng công ty, phiếu chưa xoá. Lỗi nghiệp vụ trả `{error}` (không RAISE), như các hàm `fn_portal_app_*`. GRANT EXECUTE cho `anon, authenticated` như hàm portal hiện có.

**Khoảng đăng ký của quỹ:** `tu = max(hôm nay VN, (tu_ngay AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)`, `den = (den_ngay AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`; cắt tối đa 92 ngày; quỹ thiếu `tu_ngay` hoặc `den_ngay` ⇒ không đăng ký được ("Chưa có thời gian bàn giao").

| Hàm | Việc |
|---|---|
| `fn_portal_app_bg_ca(p_token, p_ban_giao_id)` | Trả `{tu, den, ngay:[{ngay, ca:[{ca_id, ten, tu_gio, den_gio, so_khach, con}]}]}` cho mọi ngày trong khoảng đăng ký; ca hợp lệ như `fn_bg_ca_trong`; hôm nay bỏ ca có `tu_gio` ≤ giờ hiện tại VN; `con` không trừ lịch đang đổi (app tự cộng lại 1 chỗ cho ca hiện tại của lịch khi đổi) |
| `fn_portal_app_bg_dang_ky(p_token, p_ban_giao_id, p_ngay, p_ca_id)` | Kiểm: quỹ thuộc khách; `state` `PENDING`/`NOTIFIED`; chưa có lịch hiệu lực; ngày trong khoảng đăng ký; hôm nay thì ca chưa bắt đầu; `_bg_kiem_ca(tenant, ngày, ca, 1)`. Ghi `bg_lich_hen` (`lan` + 1, `CHO_XAC_NHAN`, `dia_diem`/`nhan_vien_id` null, `nguoi_nhap_id` null) + `bg_lich_su` `KH_DANG_KY` (`nguoi_ten` = tên khách). Trả `{data:{id}}` |
| `fn_portal_app_bg_doi(p_token, p_lich_id, p_ngay, p_ca_id)` | Lịch thuộc khách, **do khách tạo** (có `bg_lich_su` `KH_DANG_KY`), `CHO_XAC_NHAN`, ngày hẹn ≥ hôm nay; ngày mới trong khoảng đăng ký; `_bg_kiem_ca(…, 1, p_lich_id)`. Cập nhật ngày + ca, ghi `KH_DOI_LICH`; lịch đã từng gửi thông báo ⇒ `_bg_sau_doi_lich` như web |
| `fn_portal_app_bg_huy(p_token, p_lich_id)` | Cùng điều kiện quyền như đổi; `trang_thai = HUY`, `ly_do = 'Khách huỷ trên app'`, ghi `KH_HUY`, `_bg_huy_nhac` |

**Sửa thêm khoá (không đổi khoá cũ):** `_bg_lich_khach` trả thêm `ca_id`, `khach_dang_ky` (bool); vẫn **không** trả `ly_do` / `ghi_chu` (giữ quy tắc không lộ ghi chú nội bộ). `fn_bg_lich_list` (web) trả thêm `khach_dang_ky`. Nhãn hành động lịch sử mới: `KH_DANG_KY`, `KH_DOI_LICH`, `KH_HUY` (web hiển thị trong lịch sử lịch hẹn).

Kiểm thử: `beeland/supabase/tests/bg_16_khach_dang_ky.sql` (BEGIN … ROLLBACK, token giả lập): đặt đúng; ngày ngoài khoảng / quá khứ; ca hôm nay đã bắt đầu; ca kín; quỹ của khách khác; quỹ `HANDED_OVER`/`PAUSED`; đặt khi đã có lịch hiệu lực; đổi/huỷ lịch nhân viên tạo hoặc đã `DA_XAC_NHAN` (bị chặn); đổi giữ chỗ của chính lịch; token hết hạn.

Triển khai: chạy thử trong transaction rollback → sao lưu định nghĩa `_bg_lich_khach`, `fn_bg_lich_list` vào `~/backups/` → áp → kiểm lại.

## 5. Web (`beeland`, nhánh `devhuan`)

- Màn Lịch bàn giao (`src/pages/contracts/ban-giao/lich-ban-giao/`): lịch `khach_dang_ky` có nhãn "Khách tự đăng ký" cạnh trạng thái; lịch sử hiện `KH_DANG_KY` / `KH_DOI_LICH` / `KH_HUY` bằng chữ ("Khách đăng ký", "Khách đổi lịch", "Khách huỷ"). Luồng nhân viên không đổi (xác nhận, đổi, gửi thông báo, biên bản).
- Cập nhật `docs-claude/07-workflows/ban-giao-quyet-toan.md` mục "App khách hàng" + `09-decisions.md`.

## 6. App khách (`beeland-app-KH`)

### 6.1 Điều hướng
- Một màn **"Bàn giao căn hộ"** `/ban-giao`; `app/(app)/lich-ban-giao.tsx` thành chuyển hướng sang `/ban-giao` (giữ link cũ / thông báo).
- `lib/appModules.ts`: bỏ ô `handover-schedule`.
- Màn mới `/ban-giao/chon-lich?id=<quỹ>[&lich=<lịch đang đổi>]`.

### 6.2 Thẻ căn — khối "Lịch nhận nhà" (dưới thanh 4 bước)

Hàm thuần `appointmentState(handover, schedules, today)` (`lib/handover.ts`) trả một trong:

| Tình huống | Khách thấy |
|---|---|
| `no_window` (thiếu khoảng ngày) | "Chủ đầu tư sẽ thông báo thời gian bàn giao" |
| `can_book` (quỹ `PENDING`/`NOTIFIED`, chưa có lịch hiệu lực, `den` ≥ hôm nay) | Khối nổi bật: "Nhận nhà từ dd/MM – dd/MM", "Còn N ngày để chọn lịch", nút chính "Chọn lịch nhận nhà" |
| `pending` (lịch `CHO_XAC_NHAN`) | Khối ngày lớn + ca + badge vàng "Chờ xác nhận" + "Chủ đầu tư sẽ xác nhận và báo địa điểm"; nếu `khach_dang_ky`: nút "Đổi lịch" / "Huỷ lịch", không thì nút gọi hotline |
| `confirmed` (`DA_XAC_NHAN`/`DANG_BAN_GIAO`) | Ngày, ca, địa điểm, người phụ trách (bấm gọi `lien_he`), "Cần thanh toán trước buổi nhận: X đ" khi `so_tien_can_nop` > 0, nút "Cần đổi lịch? Gọi …" |
| `handed_over` | "Đã ký biên bản <so_bb> ngày dd/MM/yyyy" |
| `expired` (chưa có lịch hiệu lực, `den` < hôm nay, quỹ chưa bàn giao) | Cảnh báo cam "Đã qua thời gian đăng ký", nút gọi hotline |
| `paused` | Giữ cảnh báo "Bàn giao đang tạm dừng" hiện có, không cho đặt |

Lịch cũ không hiệu lực (`VANG_MAT`, `HOAN`): một dòng nhỏ "Lịch trước: dd/MM · <trạng thái>". Sắp xếp: căn `can_book` lên đầu, rồi thứ tự hiện có (`sortHandovers`).

### 6.3 Màn chọn lịch
1. `ScreenHeader` "Chọn lịch nhận nhà" · "Căn X · Dự án"; dải thông tin "Thời gian bàn giao: dd/MM – dd/MM".
2. **Chọn ngày**: dải ngày vuốt ngang (thứ · ngày · tháng), ngày còn chỗ có chấm xanh, ngày hết chỗ mờ + "Kín" (không bấm được); tự chọn ngày còn chỗ gần nhất (đổi lịch: chọn sẵn ngày hiện tại).
3. **Chọn ca**: thẻ ca "Tên · hh:mm – hh:mm · Còn n chỗ", ca kín khoá.
4. `StickyActionBar`: tóm tắt "Thứ Ba, 21/10 · 08:00 – 10:00" + nút "Xác nhận đăng ký" / "Đổi sang lịch này"; chống bấm lặp.
5. Thành công ⇒ quay về `/ban-giao`, làm mới, toast "Đã gửi đăng ký — chủ đầu tư sẽ xác nhận". Lỗi máy chủ (vd vừa hết chỗ) ⇒ toast lỗi, tải lại chỗ, giữ ngày đã chọn.
6. Đang tải: skeleton; không còn ngày nào còn chỗ ⇒ `EmptyState` "Các ngày đều đã kín" + gọi hotline.

Huỷ lịch: `Dialog` "Huỷ lịch nhận nhà ngày dd/MM?" (nút danger) ⇒ toast "Đã huỷ lịch", khối về `can_book`.

### 6.4 Dữ liệu
- `types/handover.ts`: `HandoverSchedule` mới theo `_bg_lich_khach` (`banGiaoId`, `date`, `shiftId`, `timeSlot`, `place`, `status` = mã máy chủ, `statusLabel`, `staff`, `contact`, `amountDue`, `selfBooked`, `record {code, date}`); `HandoverSlots` cho màn chọn lịch.
- `lib/handover.ts`: bỏ `ScheduleRow`/`matchSchedules` cũ; thêm `toSchedule` mới, `appointmentState`, `bookingWindow`, `dateStrip`, `slotsForDay`, nhãn trạng thái mới (`CHO_XAC_NHAN` vàng, `DA_XAC_NHAN` xanh, `DANG_BAN_GIAO` xanh, `DA_BAN_GIAO` xanh lá, `VANG_MAT`/`HOAN` đỏ).
- `services/handoverService.ts` + `services/supabase/handover.ts`: `getHandoverOverview()` (quỹ + lịch theo căn + hotline), `getHandoverSlots(id)`, `bookHandover`, `rescheduleHandover`, `cancelHandover`; bản mock trong `data/mock/handover.ts` cho chế độ offline.
- `hooks/useHandover.ts` theo hook hiện có.

### 6.5 Giao diện
Theo `design-system/beesky/MASTER.md` (Card bo 24, nút viên thuốc, badge pastel, bảng màu Xanh trời, `StickyActionBar`, `Dialog`, `LineTabs` không dùng nữa ở màn này); tạo `pages/handover-booking.md`, cập nhật `pages/handover.md`, đánh dấu `pages/handover-schedule.md` là đã gộp. Không thêm thư viện; không hex / px trực tiếp.

## 7. Kiểm thử & giao
- App: `tests/handover.test.cjs` cho `appointmentState`, `bookingWindow`, `dateStrip` (ranh giới ngày VN, hôm nay ẩn ca đã bắt đầu, khoảng > 92 ngày), `toSchedule`; checklist MASTER §13: `npx tsc --noEmit && npx expo lint && npm test && npx expo export --platform web`.
- Web: vitest cho nhãn lịch khách đăng ký; build.
- Máy chủ: `bg_16_khach_dang_ky.sql`.
- Kiểm tay (người dùng, ghi dữ liệu thật): đăng ký → web thấy "Khách tự đăng ký" → đổi → huỷ → đăng ký lại → nhân viên xác nhận + thêm địa điểm → app hiện địa điểm, nút đổi biến mất.

## 8. Ngoài phạm vi
Xác nhận của khách sau khi nhân viên xếp; chọn địa điểm; cấu hình ca theo thứ trong tuần; thông báo đẩy cho nhân viên khi có khách đăng ký (web thấy khi mở màn Lịch bàn giao).
