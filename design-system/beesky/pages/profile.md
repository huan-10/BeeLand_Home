# Trang: Cá nhân (`app/(app)/profile.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"touch target size"`, `"focus states keyboard"`; Quick Reference: `confirmation-dialogs` (xác nhận trước hành động nguy hiểm), `destructive-nav-separation`.

## Khác Master
- Một cột tối đa `layout.profileMaxWidth` (640), kể cả desktop.
- **Không có nút primary trên trang** (hành động chính nằm trong hộp thoại).

## Thành phần chính
1. **Thẻ tài khoản nền ink** (bo 28, `raised`): `Avatar lg` + tên `title` trắng + "Mã khách hàng" (`onInverseMuted`).
2. **Thông tin tài khoản**: `KeyValueRow` Công ty (khi có tên) · Mã khách hàng · Email · Số điện thoại (**3 dòng này chạm để sao chép**) · CCCD · Địa chỉ (thiếu dữ liệu → "—").
   - **Công ty (n)** — chỉ khi SĐT là khách của từ 2 công ty: thẻ menu một mục "Chuyển công ty" (icon `building`, giá trị = công ty đang xem) → `CompanyPickerDialog` (công ty đang xem viền `brand` + nền `primary` pastel + ✓; chọn công ty khác → Toast "Đã chuyển sang …", các tab tải lại dữ liệu).
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

## Nhà ở xã hội (2026-10-05)
- Mục "Bảo mật & hỗ trợ" có dòng đầu **Nhà ở xã hội** (`building`, giá trị "Đã kết nối" / "Kết nối"): đã kết nối → mở tab NOXH; chưa → `ConnectNoxhDialog` (mật khẩu hiện tại).

## Mục "Quản lý" (2026-10-06)
- Ngay dưới thẻ tài khoản: `Card padding="sm"` tiêu đề "Quản lý", 2 nhóm (nhãn nhóm `caption` đậm `textSecondary`), mỗi nhóm `QuickActions bare` (lưới 4 cột, xuống hàng, không nền thẻ riêng):
  - **Bất động sản**: Hợp đồng · Thanh toán · Phiếu thu (`/payments?tab=paid`) · Bàn giao căn hộ · Lịch bàn giao · Thông báo.
  - **Nhà ở xã hội**: Tổng quan · Hồ sơ của tôi · Bốc thăm · Kết quả · Hướng dẫn.
- "Bảo mật & hỗ trợ" bỏ 2 dòng trùng (Thông báo, Phiếu thu của tôi); còn Nhà ở xã hội (trạng thái kết nối), Đổi mật khẩu, Hotline.
- `QuickActions`: ô rộng 25% (luôn 4 cột kể cả hàng cuối thiếu mục), prop `bare` để đặt trong thẻ khác.
- 2026-10-06 (gọn lại): tiêu đề "Quản lý" `captionStrong` đậm; tên nhóm `label` `textMuted`; lưới `QuickActions bare size="sm"` (icon `md`, ô đệm `sm`, nhãn cao tự nhiên — không giữ 2 dòng). Nhãn ngắn một dòng: "Bàn giao", "Hồ sơ" (trong nhóm NOXH); chỉ "Lịch\nbàn giao" 2 dòng. Chiều cao mục còn khoảng một nửa.
- 2026-10-06 (dạng xổ xuống — thay 2 mục trên): "Quản lý" là thẻ `padding="sm"` tiêu đề `label` như các thẻ menu khác; mỗi nhóm một dòng như `MenuItem` (icon nhóm `IconCircle sm` · tên `bodyStrong` · "n mục" · `chevronDown`/`chevronUp`), `aria-expanded`; mặc định **thu gọn**, bấm mở lưới `QuickActions bare size="sm"` của nhóm ngay dưới dòng.
- 2026-10-06: tiêu đề "Quản lý" có nút **"Tuỳ chỉnh"** bên phải (icon `sliders` + chữ `textBrand`, nền tròn khi nhấn) → màn Tuỳ chỉnh Trang chủ. Danh sách nhóm / mục lấy từ `lib/appModules.ts` (nhãn `short`).
