# Thành phần dùng chung: Nhà ở xã hội (`components/domain/noxh/`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"stepper progress"` (luôn có chỉ báo "Bước n/N"), `"live region announcements"` (thông báo trạng thái có ngữ cảnh, không đọc số trần). `"countdown timer"` không có kết quả trong cơ sở dữ liệu của skill → theo quy tắc chung: chữ số đều độ rộng, tên truy cập đầy đủ.

## NoxhStatusCard — thẻ trạng thái hồ sơ
- Thẻ **nền ink** (`semantic.inverse`), bo `3xl`, bóng `raised`, padding `lg` — giống `MoneySummaryCard`; là thẻ ink **duy nhất** của màn.
- Đầu thẻ: `Badge size="md"` có chấm theo `noxhStatusMeta` (dòng riêng — để mã hồ sơ không bị bẻ dòng trên 375px), rồi "Số hồ sơ" (`caption`, `onInverseMuted`) + mã (`title`, `numeric`, trắng).
- Dòng dự án · nhóm đối tượng (`body`, trắng).
- **Thanh 5 chặng** (Nộp · Kiểm tra · Xác minh · Sở XD · Bốc thăm): 5 đoạn cao `progress.md` cách nhau `xs`; đoạn đã xong `primary.500`, chưa xong `inverseTrack`. Luôn kèm chữ "Bước n/5 · tên chặng" (`captionStrong`). `accessibilityRole="progressbar"` + nhãn đầy đủ. Hồ sơ Không đạt / Đã rút: ẩn thanh.
- `note` (việc cần làm) chữ `onInverseAccent`; `footer` chứa nút (nút sáng trên nền ink dùng `variant="secondary"`).

## StepList — các bước hồ sơ
- Hàng ≥ 44: nút tròn `timelineNode` (28) + nhãn `bodyStrong` + dòng phụ `caption`.
- Nút: **xong** nền `success.solid` + dấu tích · **đang làm** nền `action` + số trắng · **chưa tới** nền trắng viền `gray.300` + số `textMuted`. Dòng phụ mặc định "Đã xong / Đang thực hiện / Chưa tới" (màu không là tín hiệu duy nhất).
- Bước bấm được: cả hàng là nút, chevron phải, hover nền `surfaceMuted` bo `lg`.

## ProcessTimeline — quá trình xử lý
- Như `InstallmentTimeline`: rail trái nút tròn + đường nối `borderWidth.strong` (`gray.200`, đoạn đã xong `success.solid`).
- Mỗi chặng: tên `bodyStrong` + chi tiết `caption` (đang làm → `textBrand`). Chặng bấm được (Bốc thăm) có chevron + hover.

## Countdown
- `Text` `numeric` (mặc định `heading`), định dạng `2 ngày 03:04:05` / `03:04:05` (`formatCountdown`); tên truy cập "Còn …" (hoặc `label` truyền vào). Vẽ lại mỗi giây bằng `useTicker`, dừng khi app ở nền; theo **giờ máy chủ** (`useServerClock`).

## NoxhConnectCard + ConnectNoxhDialog
- Thẻ trắng bo `3xl`, padding `ml`: `IconCircle shieldCheck xl` + tiêu đề `heading` "Kết nối tài khoản Nhà ở xã hội" + mô tả; nút primary "Kết nối ngay".
- Hộp thoại "Kết nối Nhà ở xã hội": một ô **Mật khẩu hiện tại** (lỗi ngay dưới ô, focus lại ô khi lỗi), nút ghost "Để sau" + primary "Kết nối" (`shieldCheck`, `loading`). Câu giải thích: dùng chung tài khoản đang đăng nhập — **không phải đăng ký mới**.
