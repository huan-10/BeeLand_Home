# Trang: Bàn giao căn hộ (`app/(app)/ban-giao.tsx`, mở từ ô "Bàn giao căn hộ" ở Trang chủ)

> Chỉ ghi điểm khác `MASTER.md`. Dữ liệu = "Quỹ bàn giao" trên web (Hợp đồng › Bàn giao). Chỉ xem.

## Bố cục (mobile 1 cột · desktop 2 cột thẻ)
1. `ScreenHeader` "Bàn giao căn hộ" · "Tiến trình nhận nhà của từng căn" + quay lại.
2. Có buổi bàn giao sắp tới → `Section` "Lịch bàn giao sắp tới" (Xem tất cả) + `HandoverScheduleCard` tô đậm; bấm mở Lịch bàn giao.
3. Mỗi căn một `HandoverCard` (căn đang bàn giao / đã thông báo / tạm dừng lên trước, đã nhận nhà xuống cuối):
   - Ảnh dự án `sizes.roundImage` + badge trạng thái (chữ + icon) · "Căn X" + dự án.
   - `HandoverStepper` 4 bước ngang: Chuẩn bị bàn giao · Đã thông báo · Đang bàn giao · Đã nhận nhà (dùng `StepNode` của NOXH; một tên truy cập "bước n/4").
   - Tạm dừng → `NoxhAlert` đỏ "Bàn giao đang tạm dừng".
   - Dòng thông tin (icon + nhãn nhỏ + giá trị): Thời gian bàn giao · Diện tích HĐ → thực tế (+x,xx% xanh / −x,xx% cam) · Số hợp đồng · Số phiếu bàn giao.
   - Khối nền `surfaceMuted`: "Đã thanh toán" (tiền gốc) và "Phí bảo trì đã đóng" — tính từ lịch thanh toán thật của hợp đồng (thanh `sm`, 100% xanh lá); hợp đồng không có PBT → ẩn dòng PBT.
   - Ghi chú của chủ đầu tư → `NoxhAlert` xanh "Lưu ý từ chủ đầu tư".
   - Nút: "Xem lịch bàn giao" (chỉ khi căn có lịch) · "Xem hợp đồng" (secondary).

## Trạng thái
Đang tải: `SkeletonList` 2 · Lỗi: `ErrorState` + Thử lại · Chưa có hợp đồng: `EmptyState` → Nhà ở xã hội · Không có dữ liệu: `EmptyState` "Chưa có thông tin bàn giao" (+ "Xem lịch bàn giao" nếu có lịch).
