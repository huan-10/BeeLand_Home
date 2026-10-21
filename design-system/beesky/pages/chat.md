# Trang: Nhắn tin với chủ đầu tư (`app/(app)/tin-nhan.tsx`)

> Chỉ ghi điểm khác `MASTER.md`. Luồng = web "Khách hàng › BeeChat", kênh `app` (spec `beeland/docs/superpowers/specs/2026-10-12-chat-app-khach-design.md`); app dùng 3 RPC `fn_portal_app_chat_*` + edge `chat-app` (tệp) + kênh realtime công khai `chatv:<channel_key>`.

## Lối vào
- Trang chủ: nút tròn `IconButton` icon `chat` cạnh chuông; chấm đỏ khi có tin nhân viên chưa đọc (tên truy cập "Nhắn tin với chủ đầu tư, n tin nhắn chưa đọc" — `chatUnreadLabel`).
- Sidebar (≥ 768): mục phụ "Nhắn tin" dưới "Thông báo". Lưới chức năng / Cá nhân › Quản lý: mục "Nhắn tin" (không thuộc mặc định Trang chủ).

## Bố cục
- `Screen scroll={false}` + `ScreenHeader` "Nhắn tin" · "<Công ty> · Chăm sóc khách hàng" (ghim trên mobile). Nội dung tối đa `sizes.chat.contentMaxWidth` (760), căn giữa.
- **Mobile: ẩn thanh tab kính nổi** (`navItems.TAB_BAR_HIDDEN`) để ô soạn sát đáy; `KeyboardAvoidingView` (native, `padding`).
- Danh sách `FlatList inverted` (mới nhất ở đáy), kéo lên cuối danh sách → tải tin cũ (`before`), spinner nhỏ ở đầu.
- Đầu hội thoại: thẻ `ChatIntro` — `IconCircle hero` icon `headset`, tiêu đề "Nhắn tin với chủ đầu tư", mô tả ai trả lời. Chưa có tin → thêm 4 `Chip sm` câu gợi ý (bấm → điền vào ô soạn, không gửi ngay).

## Bong bóng (`ChatMessageRow`)
- Khách: phải, nền `action` (xanh đậm), chữ `textOnAction`. Nhân viên: trái, thẻ trắng `soft`; tên "Họ tên · Chủ đầu tư" (`label`, mờ) ở tin đầu cụm, `Avatar sm` chữ cái ở tin cuối cụm.
- Bo `xl` (20); trong một cụm, góc phía người gửi giữa các tin thu về `sm`. Rộng tối đa `sizes.chat.bubbleMaxWidth`, chừa lề `xl` phía đối diện.
- Cụm = cùng người gửi, ≤ 5 phút, cùng ngày (`chatRows`). Vạch ngày: viên thuốc `surfaceSunken` chữ `label` ("Hôm nay", "Hôm qua", "Thứ Hai, 12/10/2026").
- Dưới cụm: giờ `label`. Tin cuối của khách: "HH:mm · Đã gửi" / "· Đã xem" (icon `checkDouble` xanh); đang gửi "Đang gửi…" (icon `clock`); lỗi: chữ đỏ "Chưa gửi được" + nút chữ "Thử lại" (xanh) · "Xoá" (vùng chạm 44).
- Ảnh: khung bo `lg`, rộng `sizes.chat.image` (200; nhiều ảnh `imageSmall` 120, lưới), giữ tỉ lệ; link ký 5 phút xin khi hiện; bấm → mở. Tài liệu: dòng `IconCircle sm` + tên 1 dòng + dung lượng + icon tải (nền trắng trong bong bóng khách, `surfaceMuted` trong bong bóng nhân viên).
- **Trích dẫn** (nhân viên trả lời một tin trên web / app nhân viên): khung trên cùng bong bóng – vạch dọc 2px + tên ("Bạn" khi trả lời tin của khách) `label` + nội dung `caption` tối đa 2 dòng; trong bong bóng nhân viên nền `surfaceMuted` vạch `focusRing`, chữ tên `textBrand`; trong bong bóng khách chữ trắng (đủ tương phản trên `action`).
- Tin nhân viên đã sửa ghi "(đã sửa)"; tin bị thu hồi cập nhật ngay (tín hiệu realtime `updated` → tải lại).
- Thu hồi: viền mảnh, chữ nghiêng mờ "Tin nhắn đã được thu hồi". `form_request`: thẻ `IconCircle idCard` tông `info` + "Chủ đầu tư đề nghị cập nhật thông tin liên hệ".

## Ô soạn (`ChatComposer`)
- Thẻ trắng bo đỉnh 28 + `raisedTop` (như `StickyActionBar`): nút `attach` (plain) · ô nhập nền `surfaceSunken` bo `xl`, focus nền trắng viền `focusRing`, 1 dòng tự giãn tới `sizes.chat.composerMaxHeight` · nút gửi tròn 44 nền `action` icon `send` trắng (mờ `opacity.disabled` khi trống).
- Tệp chờ gửi: hàng thẻ nhỏ (ảnh thu nhỏ / icon tài liệu + tên + nút bỏ) phía trên ô nhập; ≤ 5 tệp, ≤ 20 MB, JPG/PNG/PDF/Word/Excel, chặn HEIC; nguồn chọn qua `UploadSourceSheet` (web: chọn tệp).
- Web: Enter gửi, Shift+Enter xuống dòng. > 3500 ký tự → bộ đếm "n/4000".
- Gửi lạc quan: tin hiện ngay, xoá ô soạn; lỗi → toast + "Thử lại" trên tin (cùng `client_msg_id`, máy chủ không tạo trùng).

## Đang gõ (2026-10-12)
- Nhân viên đang soạn (tín hiệu `typing` `from: 'agent'` trên `chatv:<key>`): dòng ngay trên ô soạn – viên trắng 3 chấm `iconMuted` + "Chủ đầu tư đang soạn tin…" (`caption` mờ, `accessibilityLiveRegion`), ẩn sau 4 s hoặc khi tin mới đến.
- Khách gõ (có chữ) → phát `typing` `from: 'visitor'` tối đa 1 lần / 3 s → web BeeChat / app nhân viên hiện "Khách đang gõ…".
- Kênh `chatv:<key>` dùng chung, đếm tham chiếu (Trang chủ + màn Nhắn tin) – realtime-js trả lại kênh cũ cùng topic.
- Chấm chưa đọc ở Trang chủ: nghe `chatv:<key>` → tin nhân viên mới hiện chấm ngay (không chờ quay lại Trang chủ).

## Trạng thái
| | Hiển thị |
|---|---|
| Đang tải | 3 `Skeleton` bo `xl` so le trái / phải |
| Lỗi (chưa có tin) | `ErrorState` + Thử lại trong `Card` |
| Rỗng | `ChatIntro` + câu gợi ý |
| Realtime rớt | Tự làm mới 15 s khi màn đang mở; nối lại → tải bù |
