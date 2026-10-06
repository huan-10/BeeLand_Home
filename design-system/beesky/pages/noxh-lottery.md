# Trang: Bốc thăm của tôi (`noxh/boc-tham/index.tsx`) + Phòng bốc thăm (`noxh/boc-tham/[id].tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"live region announcements"` (một vùng `role="status"` đọc trạng thái có ngữ cảnh), `"stepper progress"`.

## Thời gian
- Mọi mốc so theo **giờ máy chủ** (`useServerClock(server_now)`), đếm ngược ở máy (`Countdown`, dừng khi app ở nền). Tới giờ mở / đóng: chờ ngẫu nhiên ≤ 15 giây rồi tải lại **một lần**; app quay lại từ nền → tải lại một lần. Không thăm dò liên tục.

## Bốc thăm của tôi
- `LotteryCard` (desktop 2 cột): badge giai đoạn (`lotteryPhaseMeta`: Sắp diễn ra · Đang mở · Đã hết giờ, chờ công bố · Đã bốc thăm · Đã công bố) + mã đợt; tên đợt `heading`; hồ sơ · dự án · loại căn; khung giờ; chân thẻ (kẻ mảnh): đếm ngược "Bắt đầu sau" / "Đang mở — bốc thăm ngay" / kết quả (xanh lá khi trúng).
- Rỗng: `EmptyState trophy` "Bạn chưa có lượt bốc thăm". Chưa kết nối: `NoxhConnectCard`.

## Phòng bốc thăm
- Điện thoại: **khu bốc thăm lên đầu**, rồi thông tin lượt + quy định. Desktop 5/7: thông tin + quy định trái, khu bốc thăm phải.
- Khu bốc thăm (thẻ bo `3xl`, padding `lg`):
  - Thanh 3 bước Xác nhận → Bốc thăm → Kết quả (`StepNode`, đường nối `borderWidth.strong`, đoạn đã xong `success.solid`), tên truy cập "Bước n/3".
  - Vùng `role="status"` + `aria-live="polite"` đọc "Đang bốc thăm…" / "Kết quả: …" (không di chuyển focus).
  - **`LotteryDrum`**: lồng cầu SVG (`sizes.lotteryDrum` 200 / 260 màn rộng), vành `primary.700`, nền `primary.50`, bi nhiều màu sắc thái; xoay vô hạn (reanimated, 900ms/vòng) khi đang bốc thăm; **giảm chuyển động → đứng yên**. Ẩn khỏi trình đọc màn hình (trang trí).
  - Đếm ngược `display` "Bắt đầu sau" (sắp diễn ra) / `title` "Kết thúc sau" (đang mở); hết giờ → câu "Đã hết giờ bốc thăm…".
  - `Checkbox` "Tôi đã đọc và đồng ý quy định bốc thăm" **ngay trên nút**.
  - Nút primary `lg` "Bốc thăm" (`trophy`) — chỉ bật khi đang mở + đã đồng ý + không đang quay (`spinGuard`); đang quay: "Đang bốc thăm…" + `loading`, chặn bấm đúp; quay ≥ 2,5 s song song lời gọi máy chủ, quá 20 s → "Mất kết nối — Thử lại" (nút "Thử lại", máy chủ trả cùng kết quả); "Chưa đến giờ" → "Ban tổ chức chưa mở đợt…" + khoá 15 giây có đếm lùi.
- **`LotteryResultCard`** (khối thường trong thẻ khu bốc thăm, không lồng bóng): `IconCircle` `hero` — trúng: `confetti`/success "Chúc mừng! Bạn đã trúng căn X" + lưới 4 ô `surfaceMuted` (Tòa · Tầng · Diện tích · Phòng ngủ); chưa trúng: `info`/neutral "Rất tiếc, bạn chưa trúng" + "Bạn là dự phòng số N". Ghi chú bước tiếp theo + thời điểm mở; nút `outline` "Xem giấy xác nhận". Khi hiện, focus chuyển tới tiêu đề.
- **`LotteryCertificate`** (Dialog): đợt, dự án, số hồ sơ, phiên · loại căn, kết quả, thời điểm mở, mã kiểm chứng (16 ký tự đầu hash). Web: nút primary "In giấy xác nhận" (`window.print`); native: gợi ý chụp màn hình (xuất PDF để sau).
- Quy định: thẻ có hàng tiêu đề bấm mở/gấp (`aria-expanded`, chevron), 4 điều đánh số.

## Đúng giây mở / đóng (sửa sau review)
- Phòng bốc thăm, `LotteryCard`, `LotteryHighlightCard` vẽ lại đúng lúc chạm mốc (`useBoundaryRerender(nextBoundaryMs(...))`) → badge, đếm ngược và nút "Bốc thăm" đổi ngay ở giây mở; dữ liệu vẫn tải lại sau độ trễ ngẫu nhiên ≤ 15 giây (`useJitteredRefetch`, dùng chung cho Trang NOXH, danh sách, phòng).
- Tải lại lỗi khi đã có dữ liệu: giữ nguyên phòng, hiện dòng cảnh báo `warning.700` (icon `offline`) "Không tải lại được dữ liệu mới nhất…"; chỉ thay cả màn bằng `ErrorState` khi chưa có dữ liệu.
