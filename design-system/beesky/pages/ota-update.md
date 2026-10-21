# Trang: Đang cập nhật dữ liệu mới (`components/layout/OtaUpdateScreen.tsx`)

> Chỉ ghi điểm khác `MASTER.md`. Luồng: `docs/ota-update.md`.

- **Ngoại lệ bảng màu:** giống hệt phương án D "Navy cao cấp" của app admin (`beeland-app_2026/components/OtaUpdateScreen.tsx`), chỉ khác tên "Beeland Plus" + logo (người dùng chốt 2026-10-21). Màu lấy từ `colors.ota` (`bg`, `surface`, `track`, `accent`, `text`, `muted`), test tương phản trong `tests/contrast.test.cjs`.
- Không phải route: lớp phủ toàn màn trong `app/_layout.tsx`, `zIndex.system` (1000) trên cả toast. Chặn thao tác, không có nút đóng.
- Trên: logo (`sizes.logo.xl`, ô trắng `radius.md`) + "Beeland Plus" `heading` đậm / "Cập nhật phiên bản" `caption`.
- Giữa, căn trái: giờ `fontSizes.clock` (88/92, `letterSpacing.clock`) · thứ ngày `heading` medium · vạch cam ngắn.
- Dưới: thẻ `ota.surface` `radius.3xl` — tiêu đề "Beeland Plus đang cập nhật dữ liệu mới", "Xin vui lòng chờ ...", hàng "Đang tải bản cập nhật" + % (`title`, cam), rãnh `sizes.progress.sm`. Chưa có % → "Đang kết nối máy chủ…" và "…".
- Dòng cuối: "Ứng dụng sẽ tự mở lại khi cập nhật xong". Nội dung tối đa `layout.formMaxWidth`.
