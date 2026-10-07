# Trang: Yêu cầu (`app/(app)/yeu-cau/` — danh sách `index`, gửi `tao`, chi tiết `[id]`)

> Chỉ ghi điểm khác `MASTER.md`. Luồng = web "Khách hàng › Tiếp nhận yêu cầu" (`beeland/docs-claude/08-features/customer-requests.md`); app chỉ dùng 3 RPC portal + edge `portal-request-files`.

## Danh sách "Yêu cầu của tôi"
- Thẻ rời `ListRow card` (icon `message` theo tone trạng thái): tiêu đề tối đa 2 dòng · "Số phiếu · Loại" · "Gửi dd/MM/yyyy" | `Badge` trạng thái (màu web `mau` → tone qua `requestStatusTone`). Bấm → chi tiết.
- Nút dính đáy **"Gửi yêu cầu mới"**. Rỗng: `EmptyState` + "Gửi yêu cầu". Quay lại màn → tự tải lại (`useFocusEffect`).

## Gửi yêu cầu (chỉ ô khách cần, như mẫu)
1. **Căn hộ / hợp đồng** — `SelectField` + `PickerDialog` (có tìm, mục "Không chọn"); khách 1 hợp đồng → chọn sẵn. Không bắt buộc.
2. **Loại yêu cầu** — `Chip size="sm"` chọn 1 (bấm lại để bỏ). Không bắt buộc.
3. **Tiêu đề \*** — `Input` icon `document`, ≥ 3, ≤ 150 ký tự.
4. **Nội dung** — `Input multiline` (cao tối thiểu `sizes.textarea` 128), ≤ 1000, đếm "n/1000".
5. **Ảnh / tệp đính kèm** — `AttachmentGrid`: ô vuông `sizes.attachThumb` (76) bo `xl`; ô "Thêm" viền nét đứt xanh; ảnh thu nhỏ, tài liệu icon + đuôi + dung lượng; nút xoá tròn góc. ≤ 5 tệp, 10 MB, JPG/PNG/PDF/Word/Excel, chặn HEIC. Chọn nguồn bằng `UploadSourceSheet` (web: chọn tệp).
- Nút dính đáy **"Gửi yêu cầu"** (đang gửi: "Đang tải tệp i/n…" → "Đang gửi…"). Thành công → toast "Đã gửi yêu cầu YC…" và mở chi tiết.
- Không hỏi nguồn / ưu tiên / hạn / người xử lý — máy chủ & nhân viên gán (nguồn web/portal, trạng thái "Mới").

## Chi tiết
- Thẻ: `Badge` trạng thái + loại · tiêu đề `heading` · nội dung · `KeyValueRow` Số phiếu (sao chép) · Căn hộ / hợp đồng · Ngày gửi · Cập nhật.
- "Tệp đính kèm (n)": `ListRow card` (ảnh / tài liệu) bấm → link ký 10 phút → `openDocument`.
- "Phản hồi từ chủ đầu tư": dòng thời gian lịch sử (mới nhất trên, chấm đầu tô xanh có dấu tích) — `Badge` trạng thái · ngày giờ · nội dung. Không có ghi chú nội bộ.
- 2026-10-06: hộp chọn "Căn hộ / hợp đồng" hiện mỗi hàng 2 dòng (`PickerDialog` + `description`): **mã căn** đậm · "Dự án · Số phiếu" (caption nhạt), mỗi dòng 1 hàng chữ + "…", tách tên bằng `contractOptionParts` (thiếu phần thì không đoán). "Không chọn" có dòng phụ "Yêu cầu chung, không gắn căn hộ". Tìm kiếm khớp cả dòng phụ. Ô đã chọn hiện gọn "Mã căn · Dự án"; placeholder "Chọn căn hộ (không bắt buộc)" (1 dòng).
