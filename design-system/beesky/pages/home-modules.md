# Trang: Tuỳ chỉnh Trang chủ (`app/(app)/tuy-chinh-trang-chu.tsx`, mở từ Cá nhân › Quản lý › "Tuỳ chỉnh")

> Chỉ ghi điểm khác `MASTER.md`. Danh mục chức năng chung: `lib/appModules.ts` (`APP_MODULES`, 2 nhóm Bất động sản / Nhà ở xã hội).

- Khách chọn chức năng hiện trong lưới `QuickActions` ở Trang chủ: **1–8 mục** (2 hàng × 4), mặc định Hợp đồng · Thanh toán · Bàn giao căn hộ · Lịch bàn giao.
- **Lưu ngay mỗi lần đổi, trên máy, theo tài khoản đăng nhập** (`services/homeModules.ts`, AsyncStorage `beesky.home-modules.<accountId>`; database chỉ đọc nên không lưu server). Store có lắng nghe → Trang chủ đổi ngay; dữ liệu hỏng / mã lạ → bỏ qua, rỗng → mặc định.
- Bố cục: `Section` "Xem trước" (lưới y như Trang chủ, không bấm) → thẻ "Đang hiển thị n/8" (mỗi dòng: icon · tên tối đa 2 dòng · nút ↑ · ↓ · bỏ (đỏ); nút 44×44, mờ `opacity.disabled` khi không dùng được: đầu/cuối, chỉ còn 1 mục) → thẻ "Thêm · <nhóm>" cho mục chưa chọn (nút + ; đủ 8 thì mờ) → chú thích lưu theo tài khoản → "Khôi phục mặc định" (ghost, chỉ hiện khi khác mặc định, toast success).
- Đổi thứ tự bằng nút ↑ ↓ thay vì kéo thả: dễ bấm, có tên truy cập ("Đưa Thanh toán lên"…), không cần thư viện cử chỉ.
- Tab đang sáng: Cá nhân (`navItems` alias).
