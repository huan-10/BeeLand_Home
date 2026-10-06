# Trang: Giấy tờ (`noxh/ho-so/[id]/giay-to.tsx`) + Đã nộp (`noxh/ho-so/[id]/da-nop.tsx`)

> Chỉ ghi điểm **khác** `MASTER.md`. Tra skill (`--domain ux`): `"form validation"`, `"empty state"`.

## Giấy tờ
- `ScreenHeader` "Giấy tờ" · "Bước 3/3 · Tải giấy tờ theo danh mục" (nháp) / số hồ sơ.
- Thẻ tiến độ: "Giấy tờ bắt buộc" + `a/b` (`subhead`, `textBrand`) + `ProgressBar` (xanh lá khi đủ) + ghi chú chụp rõ nét.
- Cần bổ sung: `NoxhAlert` vàng "Cần bổ sung n giấy tờ trước dd/MM/yyyy" (`nearestDueDate`).
- **`DocumentRow`** (desktop 2 cột): `IconCircle` theo trạng thái · tên `bodyStrong` · badge trạng thái (`docStatusMeta`) + "Bắt buộc" (`info`) / "Không bắt buộc" · gợi ý định dạng/dung lượng + hạn · "Đã quá hạn nộp" (`danger.700`) · lý do chưa đạt (khối `danger` pastel) · tệp đã nộp (khối `surfaceMuted`: icon PDF/ảnh, tên, dung lượng, ngày nộp, nút tròn Xem / Bỏ tệp) · lỗi kiểm tệp ngay dưới dòng (`role="alert"`) · nút `sm`: "Tải lên" (`secondary`) / "Thay tệp" (`outline`) / "Đang tải lên…" (`loading`), "Tải mẫu" (`ghost`) khi có mẫu. Máy chủ báo thiếu → dòng đó viền `danger.600` (thẻ `outlined`, không bóng).
- **Tải lên**: `UploadSourceSheet` (Dialog 3 hàng ≥ `control.lg`: Chụp ảnh · Chọn ảnh có sẵn · Chọn tệp). Chỉ một nguồn (web, giấy tờ chỉ nhận PDF) → mở trình chọn ngay trong thao tác bấm. Tên ảnh iPhone `.HEIC` đã chuyển JPEG được đổi đuôi (`normalizePickedName`); HEIC thật bị chặn kèm hướng dẫn.
- Xem tệp: chỉ mở URL `https://` máy chủ ký; mock → Toast "Bản xem thử chưa có tệp thật để mở".
- `StickyActionBar`: nháp → primary "Nộp hồ sơ" (tắt + chữ "Còn thiếu n …" phía trên khi chưa đủ) → `Dialog` cam kết → Đã nộp; Cần bổ sung → primary "Gửi bổ sung" → Toast → Chi tiết hồ sơ.

## Đã nộp
- Cột đọc tối đa `layout.readableMaxWidth` (560), căn giữa: `IconCircle checkCircle` cỡ `hero` tông `success`, "Đã nộp hồ sơ" `title`, mô tả; thẻ `KeyValueRow` (số hồ sơ sao chép được, dự án, ngày nộp); thẻ "Các bước tiếp theo" (3 bước có icon); primary "Xem hồ sơ" + ghost "Về trang Nhà ở xã hội".
- Native: chọn nguồn trong `UploadSourceSheet` → đóng hộp, đợi tương tác xong + `motion.slow` rồi mới mở trình chọn (iOS không mở được picker khi Modal đang đóng). Web vẫn mở ngay trong thao tác bấm.
