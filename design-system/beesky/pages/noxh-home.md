# Trang: Nhà ở xã hội (`app/(app)/noxh/index.tsx`) + Hướng dẫn (`noxh/huong-dan.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Thành phần NOXH: `pages/noxh-components.md`. Tra skill (`--domain ux`): `"stepper progress"`.

## Khác Master
- Tab giữa của thanh tab (icon `building`). `ScreenHeader` "Nhà ở xã hội" · "Đăng ký, theo dõi hồ sơ và bốc thăm", bên phải chuông tròn (chấm đỏ + `unreadLabel`).
- **Thẻ chính** (desktop 7 cột) — một trong ba:
  - chưa kết nối NOXH → `NoxhConnectCard` (thẻ trắng) + `ConnectNoxhDialog`;
  - có hồ sơ → `NoxhStatusCard` (ink) của hồ sơ cần chú ý nhất (`pickFeaturedApplication`: Cần bổ sung > Nháp > Đủ điều kiện bốc thăm > đang xử lý), dòng việc cần làm (`applicationNote` / "Đang mở bốc thăm — vào bốc thăm ngay"), nút `secondary` theo trạng thái (Bổ sung ngay / Tiếp tục hồ sơ / Vào bốc thăm / Xem hồ sơ) + nút `inverse` "Xem hồ sơ";
  - chưa có hồ sơ → `NoxhInviteCard` (ink): "Đăng ký mua nhà ở xã hội", số đợt đang nhận, nút `secondary` "Xem đợt đang mở" cuộn tới mục đợt (`Screen scrollRef`, tắt hiệu ứng khi giảm chuyển động).
- **Cột phải** (desktop 5): `LotteryHighlightCard` (lượt đang mở chưa quay, hoặc lượt sắp diễn ra gần nhất — `pickLotteryHighlight`) với đếm ngược theo giờ máy chủ + nút primary duy nhất của màn; không có lượt → thẻ "Quy trình mua nhà ở xã hội" 4 bước.
- **4 ô chức năng** (`ActionTile`, tông `primary`): Hồ sơ của tôi (`document`) · Bốc thăm (`trophy`) · Kết quả (`listChecks`) · Hướng dẫn (`book`).
- **Đợt đang nhận hồ sơ** (`upcomingRounds`: Đang mở + Sắp mở, chỉ của chủ đầu tư khách có tài khoản): `RoundCard` lưới mobile 12 / tablet 6 / desktop 4 — ảnh `sizes.roundImage` (140) bo `2xl` trong thẻ bo `3xl`, badge tình trạng + "Còn N ngày" / "Mở ngày …", tên đợt `heading`, dự án · chủ đầu tư, hàng thông tin icon (khung ngày · số căn · số hồ sơ). Rỗng → `EmptyState` "Hiện chưa có đợt nhận hồ sơ".
- Trạng thái mỗi khối độc lập: Skeleton bo 28 / `ErrorState` + Thử lại; kéo để làm mới tải lại đợt, hồ sơ, bốc thăm.

## Hướng dẫn
- Hai cột desktop (6/6): Quy trình 4 bước (IconCircle + tiêu đề + mô tả) · Lưu ý khi chụp giấy tờ (gồm hướng dẫn HEIC iPhone) | Giấy tờ cần chuẩn bị (8) · Nhóm đối tượng (11, theo danh sách nạp sẵn Luật Nhà ở 2023). Nội dung tĩnh, danh sách `role="list"`.
- Đã kết nối nhưng còn công ty có website NOXH mà thiếu / mất token (hết hạn) → `NoxhConnectCard` hiện thêm dưới tiêu đề (`noxhNeedsConnect`); áp dụng cả Hồ sơ của tôi, Bốc thăm của tôi, dòng "Nhà ở xã hội" ở Cá nhân.

- 2026-10-05: 4 ô (Hồ sơ của tôi · Bốc thăm · Kết quả · Hướng dẫn) đổi sang `QuickActions` (một thẻ 4 cột, đồng bộ Trang chủ).

## Tối ưu (2026-10-06)
- Thứ tự: thẻ hồ sơ / lời mời / kết nối → lượt bốc thăm nổi bật (nếu có; desktop cột phải 5/12, không có thì thẻ hồ sơ giãn 12/12) → `QuickActions` → **Quy trình 4 bước chỉ khi khách chưa có hồ sơ** → Đợt đang nhận hồ sơ.
- `NoxhStatusCard` gọn: "Số hồ sơ" + badge cùng hàng, dự án · nhóm `caption` tối đa 2 dòng, đệm `ml` (áp dụng cả màn chi tiết hồ sơ).
- Quy trình: thẻ `md` một hàng ngang 4 bước (`IconCircle md` + "n. Tên bước"), tiêu đề "Quy trình 4 bước" + `TextLink` "Xem hướng dẫn".
- `RoundCard` dạng ngang: ảnh vuông `sizes.roundThumb` (88) bên trái; phải: badge + thời hạn, tên đợt `subhead` 2 dòng, dự án · CĐT 1 dòng, khung ngày, "n căn · n hồ sơ".
