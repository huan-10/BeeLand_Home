# Trang: Thông tin cá nhân NOXH (`app/(app)/noxh/ho-so/[id]/thong-tin.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"form validation"` (lỗi ngay dưới ô + tóm tắt lỗi đầu form, không chỉ ở đầu form).

## Khác Master
- `ScreenHeader` "Thông tin cá nhân" · "Bước 2/3 · Khai thông tin người đăng ký" (hồ sơ chỉ đọc: số hồ sơ).
- Form (`PersonalInfoForm`) chia 4 thẻ có tiêu đề + icon: **Thông tin người đăng ký** (`idCard`) · **Địa chỉ thường trú \*** (`mapPin`) · **Địa chỉ hiện tại** (`home`, checkbox "Giống địa chỉ thường trú") · **Loại căn hộ đăng ký \*** (`building`).
- Hai ô cạnh nhau khi đủ rộng (`flexBasis` = `sizes.formColumnMin` 240, tự xuống dòng trên 375px).
- **CCCD, SĐT khoá** (`editable={false}`, icon khoá, gợi ý "Theo tài khoản đăng nhập") — máy chủ ép theo tài khoản.
- Ngày (`DateInput`): bàn phím số, tự chèn "/" (`maskDate`), lưu `yyyy-MM-dd`; đủ 10 ký tự mà sai → "Ngày không hợp lệ". Ngày sinh phải đủ 18 tuổi.
- Giới tính, loại căn: `Chip` trong `role="radiogroup"`, tên truy cập kèm ", đang chọn".
- Tỉnh/xã: **`SelectField`** (cùng hình khối ô nhập "mềm", chevron xuống) mở **`PickerDialog`** (ô tìm kiếm + danh sách cao tối đa `sizes.pickerList` 320, hàng ≥ 44, mục đang chọn nền `focusHalo` + dấu tích). Phường/xã tắt tới khi chọn tỉnh; đổi tỉnh xoá xã.
- Lưu: kiểm `validatePersonalInfo` → lỗi dưới từng ô + `FormErrorSummary` đầu form (nhận focus, bấm lỗi → focus ô). Hợp lệ → lưu nháp hồ sơ → Toast → **Giấy tờ**.
- Nháp form giữ trong bộ nhớ theo hồ sơ (có CCCD/SĐT nên không ghi xuống máy), xoá khi lưu / đăng xuất.
- `StickyActionBar` primary "Lưu và tiếp tục". Hồ sơ không còn `quyen.sua_thong_tin` → bảng `KeyValueRow` chỉ xem, không có thanh nút.
