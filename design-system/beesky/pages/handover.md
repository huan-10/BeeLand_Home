# Trang: Bàn giao căn hộ (`app/(app)/ban-giao.tsx`, mở từ ô "Bàn giao căn hộ" ở Trang chủ)

> Chỉ ghi điểm khác `MASTER.md`. Dữ liệu = "Quỹ bàn giao" + "Lịch bàn giao" trên web (gộp 2026-10-16 — màn Lịch bàn giao cũ chuyển hướng về đây). Khách tự chọn lịch nhận nhà trong khoảng bàn giao (màn `handover-booking.md`).

## Bố cục (mobile 1 cột · desktop 2 cột thẻ)
1. `ScreenHeader` "Bàn giao căn hộ" · "Tiến trình và lịch nhận nhà của từng căn" + quay lại.
2. Mỗi căn một `HandoverCard` (căn đang chờ chọn lịch lên đầu, rồi đang bàn giao / đã thông báo / tạm dừng, đã nhận nhà xuống cuối):
   - Ảnh dự án `sizes.roundImage` + badge trạng thái (chữ + icon) · "Căn X" + dự án.
   - `HandoverStepper` 4 bước ngang: Chuẩn bị bàn giao · Đã thông báo · Đang bàn giao · Đã nhận nhà (dùng `StepNode` của NOXH; một tên truy cập "bước n/4").
   - Tạm dừng → `NoxhAlert` đỏ "Bàn giao đang tạm dừng".
   - **Khối "Lịch nhận nhà"** (`HandoverAppointment`, ngay dưới 4 bước; tình huống do `appointmentState` quyết định):
     - Chưa có khoảng ngày → hộp `surfaceMuted` "Chủ đầu tư sẽ thông báo thời gian bàn giao…".
     - Được chọn lịch → hộp `primary.50` bo `xl`: `IconCircle` lịch + "Nhận nhà từ dd/MM – dd/MM" + "Còn N ngày để chọn lịch nhận nhà" + nút chính "Chọn lịch nhận nhà".
     - Có lịch (chờ / đã xác nhận / đang bàn giao) → hộp `surfaceMuted`: khối ngày `sizes.scheduleDate` (chờ: nền trắng; đã xác nhận: nền `action` chữ trắng) · badge trạng thái **trên** khung giờ `subhead` · chờ: "Chủ đầu tư sẽ xác nhận và báo địa điểm" · địa điểm / người phụ trách · "Cần thanh toán trước buổi nhận" hộp vàng nhạt khi có số tiền. Lịch khách tự đặt còn chờ → 2 nút ngang "Đổi lịch" (secondary) + "Huỷ lịch" (danger, hỏi lại bằng `Dialog`); còn lại → nút outline "Cần đổi lịch? Gọi <SĐT phụ trách / hotline>".
     - Đã nhận nhà → hộp xanh lá "Đã ký biên bản … ngày dd/MM/yyyy".
     - Quá thời gian đăng ký → `NoxhAlert` vàng + nút "Gọi <hotline>".
     - Lịch cũ vắng mặt / hoãn → một dòng `caption` mờ "Lịch trước: dd/MM · <trạng thái>".
   - Dòng thông tin (icon + nhãn nhỏ + giá trị): Thời gian bàn giao · Diện tích HĐ → thực tế (+x,xx% xanh / −x,xx% cam) · Số hợp đồng · Số phiếu bàn giao.
   - Khối nền `surfaceMuted`: "Đã thanh toán" (tiền gốc) và "Phí bảo trì đã đóng" — tính từ lịch thanh toán thật của hợp đồng (thanh `sm`, 100% xanh lá); hợp đồng không có PBT → ẩn dòng PBT.
   - Ghi chú của chủ đầu tư → `NoxhAlert` xanh "Lưu ý từ chủ đầu tư".
   - Nút "Xem hợp đồng" (secondary).

## Trạng thái
Đang tải: `SkeletonList` 2 · Lỗi: `ErrorState` + Thử lại · Chưa có hợp đồng: `EmptyState` → Nhà ở xã hội · Không có dữ liệu: `EmptyState` "Chưa có thông tin bàn giao". Huỷ lịch thành công → toast "Đã huỷ lịch nhận nhà"; quay lại từ màn chọn lịch → tự tải lại.
