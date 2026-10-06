# Trang: Chi tiết hồ sơ NOXH (`app/(app)/noxh/ho-so/[id]/index.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Thành phần: `pages/noxh-components.md`.

## Bố cục
- `ScreenHeader` "Chi tiết hồ sơ" · phụ đề tên dự án, nút quay lại (không có lịch sử → `/noxh/ho-so`).
- Desktop 5/7. **Cột trái**: `NoxhStatusCard` (ink) → `NoxhAlert` theo trạng thái → thẻ "Các bước hồ sơ" (`StepList`, bước 1 → Thông tin cá nhân, bước 2 → Giấy tờ, kèm "Còn thiếu n mục" / "Đã nộp a/b giấy tờ bắt buộc") → thẻ "Thao tác". **Cột phải**: "Quá trình xử lý" (`ProcessTimeline` theo giờ máy chủ; chặng Bốc thăm bấm được khi có lượt) → "Thông tin hồ sơ" (`KeyValueRow`, số hồ sơ sao chép được). Mobile: cùng thứ tự, một cột (thao tác nằm ngay dưới các bước).

## NoxhAlert (khối pastel, icon + tiêu đề + lý do)
| Trạng thái | Tông / icon | Nội dung |
|---|---|---|
| Cần bổ sung | `warning` / `warning` | "Hồ sơ cần bổ sung giấy tờ" + lý do mới nhất (`latestReason`) |
| Không đạt | `danger` / `closeCircle` | "Hồ sơ không đạt" + lý do |
| Đã rút | `neutral` / `info` | "Hồ sơ đã được rút" + lý do |
| Nháp | `primary` / `info` | "Hồ sơ chưa được nộp" + hạn nộp của đợt |
`role="alert"` cho `warning`/`danger`.

## Thao tác (chỉ theo `quyen` máy chủ trả)
- Cần bổ sung: primary "Bổ sung giấy tờ" (`upload`) → Giấy tờ.
- Nháp: primary "Nộp hồ sơ" — **tắt** khi còn thiếu thông tin / giấy tờ bắt buộc, chữ gợi ý "Còn thiếu n …" dưới nút; bấm → `Dialog` cam kết "Tôi cam đoan…" (ghost "Xem lại" · primary "Nộp hồ sơ") → màn Đã nộp. Máy chủ báo thiếu giấy tờ/thông tin → Toast + mở màn tương ứng.
- Nháp: `danger` "Xoá hồ sơ" → `Dialog` xác nhận "Xoá hồ sơ chưa nộp?".
- Trạng thái khác: ẩn thẻ Thao tác.
