# Trang: Hồ sơ của tôi (`noxh/ho-so/index.tsx`) + Tạo hồ sơ (`noxh/ho-so/tao.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"stepper progress"` (phụ đề "Bước 1/3").

## Hồ sơ của tôi
- `Screen top/sticky`: `ScreenHeader` (quay lại) · thanh bám dính `ChipBar` 4 lọc `role="tab"` có số đếm (`applicationFilter`): Tất cả · Đang xử lý · Cần bổ sung · Đã xong.
- `ApplicationCard` (thẻ bấm được, `hoverLift`): hàng đầu số hồ sơ `subhead numeric` + badge trạng thái — **tự xuống dòng** (`flexWrap`) khi badge dài để không bẻ mã hồ sơ; dự án `bodyStrong`; đợt · nhóm `caption`; `ProgressBar sm` "Đã nộp a/b giấy tờ" + ngày tạo/nộp; Cần bổ sung → dòng cảnh báo `warning.700` có icon.
- Lưới: mobile 1 cột, desktop 2 cột. Chưa kết nối NOXH → `NoxhConnectCard`. Rỗng → `EmptyState` + "Xem đợt đang mở".

## Tạo hồ sơ
- `ScreenHeader` "Tạo hồ sơ" · "Bước 1/3 · Chọn nhóm đối tượng và loại căn".
- Khối `sunken` tóm tắt đợt (icon toà nhà, tên đợt, chủ đầu tư · hạn nhận, badge tình trạng).
- **`ChoiceCard`** (radio) trong `role="radiogroup"`: thường = thẻ trắng bóng `soft`; đang chọn = nền `primary.50` + viền `action` 2px, **không** bóng; vòng radio 24 (`sizes.checkbox`), chấm `action`. Nhóm đối tượng có mô tả; loại căn chỉ có tên.
- Lỗi (chưa chọn / máy chủ) hiện ngay trên ghi chú cuối, `role="alert"`, chữ `danger.700` + icon. Đã có hồ sơ ở dự án → Toast + mở hồ sơ đó.
- `StickyActionBar` primary "Tạo hồ sơ" (`loading`) → lưu nháp → Thông tin cá nhân.
