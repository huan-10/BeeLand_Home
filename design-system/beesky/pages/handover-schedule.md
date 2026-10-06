# Trang: Lịch bàn giao (`app/(app)/lich-ban-giao.tsx`)

> Chỉ ghi điểm khác `MASTER.md`. Dữ liệu = "Lịch bàn giao" trên web. **Chỉ xem** (xác nhận / xin đổi lịch làm sau).

- `ScreenHeader` "Lịch bàn giao" · "Ngày giờ nhận bàn giao căn hộ của bạn"; vùng bám dính `LineTabs` **Sắp tới n | Đã qua n**.
- Sắp tới = từ hôm nay (giờ VN) và chưa bàn giao, gần nhất trước, buổi đầu tô đậm; Đã qua = còn lại, mới nhất trước.
- `HandoverScheduleCard`: khối ngày rộng `sizes.scheduleDate` (64) nằm trên (tháng · ngày `title` · thứ; sắp tới gần nhất nền `action` chữ trắng, đã qua / hoãn nền `surfaceMuted`) · khung giờ `subhead` đậm (hoãn: gạch ngang) · badge trạng thái theo **nhãn gốc** của server (Chờ xác nhận vàng · Đã xác nhận xanh · Đã bàn giao xanh lá · Hoãn lịch đỏ) · Căn · dự án, hình thức, "Phụ trách: …", ghi chú (hoãn: nền đỏ nhạt).
- Thẻ cuối "Cần đổi lịch bàn giao?" + nút secondary "Gọi <hotline chủ đầu tư>" (`tel:`); không có hotline → ẩn.
- Rỗng: Sắp tới "Chưa có lịch bàn giao sắp tới" (+ "Xem lịch đã qua" nếu có) · Đã qua "Chưa có buổi bàn giao nào đã qua".
