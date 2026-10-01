# Trang: Cá nhân (`app/(app)/profile.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"touch target size"`, `"focus states keyboard"`; Quick Reference: `confirmation-dialogs` (xác nhận trước hành động nguy hiểm), `destructive-nav-separation`.

## Khác Master
- Một cột tối đa `layout.profileMaxWidth` (640), kể cả desktop.
- **Không có nút primary trên trang** (hành động chính nằm trong hộp thoại).

## Thành phần chính
1. **Thẻ tài khoản nền ink** (bo 28, `raised`): `Avatar lg` + tên `title` trắng + "Mã khách hàng" (`onInverseMuted`).
2. **Thông tin tài khoản**: `KeyValueRow` Mã khách hàng · Email · Số điện thoại (**3 dòng đầu chạm để sao chép**) · CCCD · Địa chỉ (thiếu dữ liệu → "—").
3. **Bảo mật & hỗ trợ** (menu, mỗi mục cao ≥ 52, hover/nhấn nền `gray.50`): **Đổi mật khẩu** · Thông báo · Phiếu thu của tôi · Hotline hỗ trợ 1900 6868 (mở `tel:`).
4. **Đăng xuất**: `Button danger` tách riêng dưới menu → **hộp thoại xác nhận** "Đăng xuất?" (Hủy / Đăng xuất danger, có loading).
5. **Phiên bản app**: "BeeSky · Phiên bản 1.0.0 · Web/iOS/Android" (`lib/appInfo.ts`, từ `app.json`).

## Đổi mật khẩu (`ChangePasswordDialog`, chỉ giao diện)
- 3 ô `password` có nhãn: Mật khẩu hiện tại (`current-password`) · Mật khẩu mới (`new-password`) · Nhập lại mật khẩu mới.
- Kiểm tra (`validateChangePasswordForm`): bắt buộc, ≥ 6 ký tự, khác mật khẩu cũ, nhập lại khớp; lỗi dưới từng ô, focus ô lỗi đầu tiên.
- Gửi → `changePassword(userId, current, new)` (`services/authService.ts`, **TODO** API): mock kiểm tra mật khẩu hiện tại (sai → lỗi gắn ô "Mật khẩu hiện tại"), **không lưu** mật khẩu mới, trả `unavailable` → Toast thông tin.

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang lưu mật khẩu / đăng xuất | Nút `loading` trong hộp thoại |
| Chưa có người dùng | Không hiển thị (route guard đưa về Đăng nhập) |
