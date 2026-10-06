# Trang: Kết quả bốc thăm (`app/(app)/noxh/ket-qua.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"data table responsive"` (màn hẹp dùng thẻ, không cuộn ngang).

## Khác Master
- `Screen top/sticky`: `ScreenHeader` · vùng bám dính gồm chọn đợt (≤ 4 đợt: `ChipBar` mã đợt `role="tab"`; > 4: `SelectField` + `PickerDialog`) và ô tìm "Nhập số hồ sơ" (khớp một phần, bỏ khoảng trắng — `filterPublishedRows`, trễ 300ms).
- Thẻ đợt: tên `heading`, mã · dự án, 3 số liệu `title numeric` (Hồ sơ tham gia · Số căn · Hồ sơ trúng — tô `textSuccess`).
- Danh sách: màn hẹp → thẻ (số hồ sơ `subhead numeric` + badge Trúng/Chưa trúng, "Phiên n · căn / Dự phòng số N"); ≥ 1024 → `DataTable` 4 cột (Số hồ sơ · Phiên · Kết quả · Căn / dự phòng, cột cuối căn phải).
- Phân trang 20 dòng (`paginate`): `outline sm` "Trang trước" / "Trang sau" + "n/N", `role="navigation"`.
- Không hiển thị họ tên / CCCD (máy chủ không trả). Rỗng: `EmptyState listChecks` "Chưa có kết quả công bố"; tìm không thấy: `EmptyState search`.
