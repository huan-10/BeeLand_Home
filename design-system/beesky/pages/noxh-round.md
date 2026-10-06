# Trang: Chi tiết đợt nhận hồ sơ (`app/(app)/noxh/dot/[id].tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`.

## Khác Master
- `ScreenHeader` "Chi tiết đợt" + phụ đề tên chủ đầu tư, nút quay lại (không có lịch sử → `/noxh`).
- Desktop 7/5. Cột trái: ảnh dự án `projectImage` bo `3xl` · badge tình trạng `md` · tên đợt `title` · dòng dự án/chủ đầu tư (`building`) và địa chỉ (`mapPin`) · "Giới thiệu đợt" (chữ thường giữ xuống dòng, không HTML) · "Nhóm đối tượng được nộp" (thẻ, mỗi nhóm một hàng cao `control.lg`, bấm mở/gấp mô tả, `aria-expanded`, chevron lên/xuống).
- Cột phải: thẻ số liệu bo `3xl` (Thời gian nhận · Số căn · Đã nộp) + khối `sunken` đếm ngược ("Thời gian còn lại để nộp hồ sơ" / "Mở nhận hồ sơ sau", tới mốc thì tải lại) · khối `sunken` lưu ý (1 người 1 hồ sơ mỗi dự án, định dạng/dung lượng tệp).
- **`StickyActionBar`** một nút (primary hoặc tắt kèm lý do): "Mở hồ sơ của bạn" (đã có hồ sơ ở dự án) · "Kết nối để đăng ký hồ sơ" (công ty chưa có token NOXH → `ConnectNoxhDialog`) · "Đăng ký hồ sơ" → `/noxh/ho-so/tao?dot=` · tắt: "Mở nhận hồ sơ từ dd/MM/yyyy" / "Đợt đã kết thúc nhận hồ sơ".

## Cập nhật CCCD trước khi đăng ký (2026-10-05)
- "Đăng ký hồ sơ" (nút có `loading` trong lúc hỏi `fn_portal_noxh_tai_khoan`): tài khoản ở công ty của đợt chưa có CCCD (`co_cccd = false`) → `UpdateCccdDialog`: mô tả lý do, ô "Số CCCD" (bàn phím số, điền sẵn CCCD hồ sơ app nếu đủ 12 số, gợi ý "Sau khi cập nhật, muốn đổi CCCD phải liên hệ chủ đầu tư"), lỗi máy chủ ngay dưới ô; ghost "Để sau" · primary "Cập nhật" (`idCard`). Xong → Toast "Đã cập nhật CCCD" → Tạo hồ sơ.
- Cùng hộp thoại mở khi máy chủ báo "Tài khoản chưa có CCCD…" ở Tạo hồ sơ (tự tạo lại sau khi cập nhật), Chi tiết hồ sơ và Giấy tờ (tự nộp lại).
