# Trang: Chọn lịch nhận nhà (`app/(app)/ban-giao/chon-lich.tsx`)

> Chỉ ghi điểm khác `MASTER.md`. Mở từ khối "Lịch nhận nhà" ở `handover.md`: `?id=<quỹ>` đăng ký mới, thêm `&lich=&ngay=&ca=` là đổi lịch. Dữ liệu = ca ký bàn giao (`fn_portal_app_bg_ca`); gửi = ghi thật (`fn_portal_app_bg_dang_ky` / `_doi`), lịch ở trạng thái **Chờ xác nhận**.

## Bố cục
1. `ScreenHeader` "Chọn lịch nhận nhà" / "Đổi lịch nhận nhà" · "Căn X · Dự án".
2. `NoxhAlert` xanh "Thời gian bàn giao: dd/MM – dd/MM" + "Chủ đầu tư sẽ xác nhận lịch và báo địa điểm nhận nhà cho bạn."
3. `Section` "Chọn ngày" — `DateStrip`: hàng vuốt ngang, mỗi ngày là ô rộng `sizes.scheduleDate` bo `xl` (thứ `label` · ngày `title` · tháng `label` · chấm xanh lá `sizes.dot.md` = còn chỗ). Chọn = nền `inverse` chữ trắng (như chip lọc); ngày kín = `surfaceMuted` mờ `opacity.disabled` + chữ "Kín", không bấm được. `role="radiogroup"` / `radio` + `aria-checked`; tên đọc "Thứ Ba 21 tháng 10, còn chỗ". Đổi lịch sang ngày xa → tự cuộn tới.
4. `Section` "Chọn ca" — `ShiftOption`: thẻ trắng `soft` bo `xl`, cao ≥ 52: vòng chọn · giờ `bodyStrong` + tên ca `caption` · badge "Còn n chỗ" (xanh lá) / "Kín" (xám, khoá). Chọn = nền `primary.50` + viền `action` 2 (không bóng).
5. `StickyActionBar`: dòng tóm tắt "Thứ Sáu, 16/10 · 10:00 – 12:00" (`aria-live`) + nút chính "Xác nhận đăng ký" / "Đổi sang lịch này" (`loading`, khoá khi chưa chọn ca hoặc chưa đổi gì).

## Hành vi
- Mặc định chọn ngày còn chỗ gần nhất; đổi lịch → ngày + ca đang giữ (chỗ của chính khách được tính là còn).
- Thành công → toast "Đã gửi đăng ký — chủ đầu tư sẽ xác nhận" / "Đã đổi lịch nhận nhà" → quay về Bàn giao (tự tải lại).
- Lỗi máy chủ (vd ca vừa kín) → toast lỗi, tải lại chỗ, giữ ngày đã chọn; "đã có lịch hẹn hiệu lực" → quay về Bàn giao.

## Trạng thái
Đang tải: `Skeleton` + `SkeletonList` 3 · Lỗi: `ErrorState` + Thử lại · Không ngày nào còn chỗ: `EmptyState` "Các ngày đều đã kín" + "Gọi <hotline>" (ẩn thanh dính) · Ngày không có ca: dòng `caption` "Ngày này không còn ca nhận nhà".
