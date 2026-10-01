# Trang: Cá nhân (`app/(app)/profile.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`.

## Khác Master
- Nội dung là **một cột** rộng tối đa `layout.profileMaxWidth` (640), căn trái trong vùng nội dung — kể cả trên desktop (không chia lưới).
- Avatar `lg` (64) chữ cái đầu trên nền `primary.100`.
- **Đăng xuất** là nút `danger` riêng, đặt tách biệt dưới danh sách menu (skill: `destructive-nav-separation`); không phải nút primary. Trên desktop, đăng xuất còn có ở thẻ người dùng cuối sidebar.

## Thành phần chính
1. Thẻ hồ sơ: avatar + tên `h2` + mã khách hàng.
2. Thẻ "Thông tin liên hệ" (`label` `textMuted`): `InfoRow` Email, Số điện thoại, CCCD, Địa chỉ.
3. Thẻ menu (padding `sm`): mục có `IconCircle sm` + nhãn + mũi tên — Thông báo, Phiếu thu của tôi; mục chỉ đọc "Hotline hỗ trợ · 1900 6868" (không mũi tên, không bấm được).
4. Nút Đăng xuất + dòng phiên bản `caption` căn giữa.

## Trạng thái
| Trạng thái | Hiển thị |
|-----------|----------|
| Đang đăng xuất | Nút Đăng xuất `loading` |
| Chưa có người dùng | Không hiển thị (route guard đưa về Đăng nhập) |
