# Nhà ở xã hội (NOXH) trong app khách hàng — thiết kế

Ngày: 2026-10-05 · Trạng thái: chờ duyệt · Phạm vi: `beeland-app-KH`

Nguồn nghiệp vụ (đọc trước khi sửa):
- `../beeland/docs-claude/07-workflows/nha-o-xa-hoi.md` — trạng thái hồ sơ, quyền của khách, bốc thăm.
- `../beeland/docs-claude/03-supabase.md` mục "Trang công khai" — danh sách `fn_portal_noxh_*`.
- `../beeland/src/pages/CustomerPortal/noxh/types.ts` — kiểu JSON trả về (tên trường giữ nguyên ở lớp service).

## 1. Mục tiêu

Khách hàng làm **toàn bộ phần việc của mình** trong luồng NOXH ngay trong app, như trên web Portal `mau4`:

1. xem đợt đang nhận hồ sơ;
2. đăng nhập bằng chính tài khoản hiện có (SĐT hoặc CCCD);
3. tạo hồ sơ, điền thông tin cá nhân, tải giấy tờ, nộp hồ sơ;
4. theo dõi xét duyệt, bổ sung khi bị yêu cầu;
5. bốc thăm online, xem kết quả, xem giấy xác nhận;
6. nhận thông báo (lịch bốc thăm, kết quả, huỷ đợt).

Phần nhân viên (thẩm định, tạo đợt, quản trị bốc thăm) **không** thuộc app.

**Tiêu chí hoàn thành đợt này:**
- Đi hết các luồng trên với dữ liệu giả, ở cả 375 / 768 / 1024 / 1440px.
- Giao diện đúng MASTER.md (Xanh trời) và các file `pages/noxh-*.md` mới.
- `tsc`, `expo lint`, `npm test`, `expo export --platform web` đều đạt.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| Q1 | Thanh tab: **Trang chủ · Hợp đồng · Nhà ở XH · Thanh toán · Cá nhân** (NOXH ở giữa) | 6 ô chỉ icon (6 × 64px) không vừa thanh tab nổi trên màn 375px |
| Q2 | **Phiếu thu gộp vào Thanh toán** qua thanh phân đoạn "Lịch thanh toán \| Phiếu thu" | Cùng nhóm tiền; route `/receipts` giữ nguyên để link cũ và thông báo vẫn mở được |
| Q3 | **Dữ liệu giả trước** (`NOXH_BACKEND = 'mock'`), nối API thật ở giai đoạn sau | Database chỉ được đọc; nộp hồ sơ, tải tệp, quay bốc thăm đều ghi |
| Q4 | Nhãn, màu, quyền theo trạng thái lấy đúng bảng `portalStatus` của web | Khách thấy cùng nhãn ở web và app |
| Q5 | Màu theo bảng Xanh trời của app, **không** dùng cam của Portal | Bộ nhớ dự án: app KH dùng bảng màu riêng |

## 3. Vấn đề nền tảng và cách xử lý

### 3.1 Một tài khoản, hai token phiên

**Một người = một tài khoản `cloud_portal_accounts` ở mỗi công ty, một mật khẩu** (người dùng xác nhận 2026-10-05).
- Đăng ký NOXH trên web (`fn_portal_noxh_register_verify`) ghi vào **chính bảng này**: `username` = SĐT (trừ khi SĐT đã là username khác), `cccd`, `di_dong`, `nguon_web_config_id` = website `mau4`, `pham_vi` = `CHON` (mặc định) hoặc `TAT_CA` theo cài đặt website.
- Hàm này cũng tạo hoặc khớp dòng `cloud_customers` có SĐT.
- Hệ quả: người đã đăng ký NOXH **đăng nhập app bằng chính SĐT/CCCD + mật khẩu đó**, không có tài khoản "NOXH riêng".

Khác biệt chỉ nằm ở **token phiên** (do máy chủ quy định, khách không thấy):
- `fn_portal_login(company_id, username, password)` (đường app đang dùng) cho token hợp đồng. Hàm này **từ chối** tài khoản tự đăng ký qua website (`nguon_web_config_id` có giá trị) và tài khoản `pham_vi = 'CHON'` (R21).
- `fn_portal_site_login(slug, login, password)` nhận SĐT, email, username hoặc CCCD 12 số. Gọi trên slug `mau4` cho token NOXH.
- Token `mau4` chỉ gọi được `fn_portal_noxh_*`; token khác `mau4` không gọi được hàm NOXH (R19).

Cách xử lý:
- `CompanySession.token` (hợp đồng) thành **tuỳ chọn**, thêm `noxh?: { slug: string; token: string }`. Mỗi công ty có ít nhất một trong hai.
- **Đăng nhập** (ô nhập nhận **SĐT hoặc CCCD**). Với mỗi công ty có hồ sơ khách:
  - tài khoản do nhân viên/app cấp (`nguon_web_config_id` rỗng, `TAT_CA`) → `fn_portal_login` như hiện nay, **cộng** `fn_portal_site_login` trên slug `mau4` của công ty (nếu có) để lấy token NOXH;
  - tài khoản tự đăng ký qua website `mau4` → chỉ `fn_portal_site_login` trên slug của **chính website đã đăng ký** (`nguon_web_config_id`; không có thì slug `mau4` của công ty). `fn_portal_login` luôn từ chối tài khoản này (R21: chỉ nhận `TAT_CA` do nhân viên cấp), kể cả khi website để `TAT_CA`.
  - `fn_portal_login` từ chối một tài khoản được coi là nhân viên cấp (ví dụ máy chủ không trả `nguon_web_config_id`) mà công ty có website `mau4` → thử lại bằng `fn_portal_site_login`.
  - Cần kiểm khi nối thật: `fn_portal_account_get` có trả `nguon_web_config_id` / `pham_vi` không. Nếu không, thử `fn_portal_login` trước, lỗi thì dùng `fn_portal_site_login`.
- **Công ty chỉ có token NOXH**: Hợp đồng, Thanh toán, Phiếu thu của công ty đó trả rỗng, không gọi server. Màn rỗng ghi: "Khi trúng bốc thăm và ký hợp đồng, thông tin sẽ hiển thị tại đây."
- **Khách đã đăng nhập từ trước bản này** (app không lưu mật khẩu, chưa có token NOXH): tab NOXH hiện thẻ "Kết nối Nhà ở xã hội" → `ConnectNoxhDialog` nhập **mật khẩu hiện tại** một lần → `fn_portal_site_login`. Cách làm giống `LinkCompanyDialog`. Đây không phải đăng ký mới.

### 3.2 Không có luồng đăng ký riêng

Người dùng chốt 2026-10-05: **tài khoản đăng nhập app chính là tài khoản NOXH** (đã đăng ký rồi), nên app **không** thêm màn đăng ký NOXH bằng CCCD.
- Màn Đăng ký và Đăng nhập giữ nguyên luồng. Chỉ thay đổi ô đăng nhập: nhận cả CCCD, cho người từng đăng ký trên website NOXH.
- Muốn nộp hồ sơ: đăng nhập app → tab Nhà ở XH → chọn đợt → tạo hồ sơ.
- Người chưa là khách hàng: đăng ký trên website NOXH của chủ đầu tư hoặc được chủ đầu tư tạo hồ sơ khách trước. Sau đó đăng nhập app bằng chính tài khoản đó.

### 3.3 Nhiều chủ đầu tư

- **Đợt nhận hồ sơ**: gộp từ website `mau4` của **các công ty khách đã có tài khoản** (mọi công ty trong `session.companies`). Như vậy khách không gặp đợt mà mình không nộp được. Thẻ đợt ghi tên chủ đầu tư. Bản thật: tài khoản hệ thống đọc slug ở `cloud_customer_web_configs` (`template_code = 'mau4'`, đang chạy) rồi gọi `fn_portal_noxh_dot_list(slug)`.
- Công ty có tài khoản nhưng chưa có token NOXH: đợt vẫn hiện, nút "Đăng ký hồ sơ" mở `ConnectNoxhDialog`.
- **Hồ sơ, bốc thăm, thông báo NOXH**: gộp từ mọi công ty đã có token NOXH. Không phụ thuộc công ty đang xem, vì khách NOXH ít khi biết khái niệm "công ty đang xem".

## 4. Điều hướng

### 4.1 Thanh tab và sidebar

- `navItems.ts`:
  - `primaryNavItems` = `index`, `contracts`, `noxh` (icon `building`, nhãn "Nhà ở XH"), `payments`, `profile`.
  - Sidebar dùng nhãn đầy đủ "Nhà ở xã hội".
- `app/(app)/_layout.tsx`:
  - Thêm `Tabs.Screen name="noxh"`.
  - `receipts` chuyển thành `href: null`.
- `AppNavigation`: route `receipts` được coi là tab `payments` khi tô tab đang chọn, gồm cả viên kính trượt và mục sidebar.

### 4.2 Thanh toán ↔ Phiếu thu

- Component mới `PaymentsSegment` (dùng `Tabs` sẵn có), nằm trong vùng `sticky` của cả `payments.tsx` và `receipts/index.tsx`.
- Bấm tab dùng `router.navigate` sang route kia.
- Tiêu đề màn vẫn giữ riêng ("Lịch thanh toán" / "Phiếu thu").

### 4.3 Route NOXH (`app/(app)/noxh/`, Stack giống `contracts/_layout.tsx`)

| Route | Màn |
|---|---|
| `noxh/index` | Trang NOXH |
| `noxh/dot/[id]` | Chi tiết đợt |
| `noxh/huong-dan` | Hướng dẫn (quy trình, đối tượng, giấy tờ cần chuẩn bị, liên hệ) |
| `noxh/ho-so/index` | Hồ sơ của tôi |
| `noxh/ho-so/tao` (`?dot=`) | Tạo hồ sơ |
| `noxh/ho-so/[id]/index` | Chi tiết hồ sơ |
| `noxh/ho-so/[id]/thong-tin` | Thông tin cá nhân |
| `noxh/ho-so/[id]/giay-to` | Giấy tờ |
| `noxh/ho-so/[id]/da-nop` | Đã nộp thành công |
| `noxh/boc-tham/index` | Bốc thăm của tôi |
| `noxh/boc-tham/[id]` | Phòng bốc thăm (`id` = `bt_ho_so_id`) |
| `noxh/ket-qua` | Kết quả đã công bố |

Link thông báo của server (`boc-tham/<id>`, `ho-so/<id>`) được đổi sang `/noxh/...` bằng `lib/noxh.ts → noxhLinkToHref`. Link lạ → `/noxh`.

## 5. Màn hình

Quy tắc chung cho mọi màn:
- Dùng `Screen`, `ScreenHeader` có nút quay lại (trừ Trang NOXH), lề 20 trên mobile, nội dung tối đa 1100px trên web.
- Mỗi màn tối đa một nút primary.
- Mỗi danh sách có Skeleton, EmptyState, ErrorState + Thử lại, và kéo để làm mới.

### 5.1 Trang NOXH (`noxh/index`)

Thứ tự từ trên xuống. Desktop dùng lưới 7/5 như Trang chủ.

1. **Header**: "Nhà ở xã hội" (`title`) + phụ đề "Đăng ký, theo dõi hồ sơ và bốc thăm" + chuông (dùng chung số chưa đọc).
2. **Thẻ chính nền xanh đêm** (duy nhất một thẻ ink trên màn):
   - Đã có hồ sơ còn hiệu lực (chọn hồ sơ cần chú ý nhất, `pickFeaturedApplication`): số HS, dự án, badge trạng thái, thanh 5 chặng (Nộp · Kiểm tra · Xác minh · Sở XD · Bốc thăm), một dòng việc cần làm ("Cần bổ sung 2 giấy tờ", "Đang mở bốc thăm"…) và nút sáng "Xem hồ sơ" / "Bổ sung ngay" / "Vào bốc thăm".
   - Chưa có hồ sơ: "Đăng ký mua nhà ở xã hội" + mô tả ngắn + nút "Xem đợt đang mở".
   - Chưa kết nối NOXH: thay bằng thẻ trắng "Kết nối tài khoản Nhà ở xã hội" + nút mở `ConnectNoxhDialog`.
3. **Thẻ bốc thăm** (chỉ khi có lượt `DA_KHOA` sắp tới hoặc `DANG_MO` chưa quay): tên đợt, khung giờ, `Countdown` theo giờ máy chủ, nút "Vào phòng bốc thăm".
4. **4 ô chức năng** (`ActionTile`, tông `primary`): Hồ sơ của tôi (`document`) · Bốc thăm (`trophy`) · Kết quả (`listChecks`) · Hướng dẫn (`book`).
5. **Section "Đợt đang nhận hồ sơ"**: thẻ đợt `RoundCard` gồm ảnh (`ProjectImage`), tên đợt, dự án, chủ đầu tư, khung thời gian, số căn, badge Đang mở / Sắp mở, "Còn N ngày". Không có đợt → EmptyState "Hiện chưa có đợt nhận hồ sơ".
6. **Section "Quy trình"** (chỉ khi chưa có hồ sơ): 4 bước ngắn (Đăng ký tài khoản → Nộp hồ sơ → Xác minh → Bốc thăm).

### 5.2 Chi tiết đợt (`noxh/dot/[id]`)

- Ảnh bìa bo 28, tên đợt, dự án, địa chỉ, chủ đầu tư, badge tình trạng.
- Khối số liệu (`Card sunken`): Thời gian nhận · Số căn · Đã nộp.
- **Nhóm đối tượng được nộp**: danh sách mở/gấp xem mô tả.
- Mô tả đợt, hiển thị dạng chữ thường (`pre-line`, không HTML).
- `StickyActionBar`:
  - "Đăng ký hồ sơ" khi đợt Đang mở;
  - "Mở hồ sơ của bạn" khi đã có hồ sơ ở dự án này;
  - nút tắt kèm lý do khi Sắp mở / Đã đóng.

### 5.3 Tạo hồ sơ (`noxh/ho-so/tao`)

- Đợt đã chọn (thẻ gọn).
- **Nhóm đối tượng**: thẻ chọn một (radio card), có mô tả.
- **Loại căn hộ**: chip chọn một, nguồn `fn_portal_noxh_loai_can`.
- Nút "Tạo hồ sơ" → lưu nháp → mở Thông tin cá nhân.
- Máy chủ báo đã có hồ sơ (`hoSoId`) → Toast + mở hồ sơ đó.

### 5.4 Hồ sơ của tôi (`noxh/ho-so/index`)

- `ChipBar` lọc: Tất cả · Đang xử lý · Cần bổ sung · Đã xong.
- Thẻ `ApplicationCard`: số HS (`numeric`), dự án, đợt, badge trạng thái, thanh "Đã nộp a/b giấy tờ", dòng cảnh báo khi cần bổ sung.
- Rỗng → EmptyState + "Xem đợt đang mở".

### 5.5 Chi tiết hồ sơ (`noxh/ho-so/[id]`)

1. **Thẻ trạng thái** (ink): số HS, dự án · nhóm · loại căn, badge, thanh tiến độ 4 bước, ngày nộp.
2. **Alert theo trạng thái**:
   - Cần bổ sung (`warning`) và Không đạt / Đã rút (`danger` / `neutral`): hiện lý do lấy từ lịch sử.
   - Nháp: "Hồ sơ chưa được nộp".
3. **Các bước** (`StepList`): ① Thông tin cá nhân → `thong-tin` · ② Thành phần hồ sơ → `giay-to` · ③ Xác minh · ④ Đủ điều kiện. Mỗi bước có trạng thái xong / đang làm / chưa (icon + chữ, không chỉ màu).
4. **Quá trình xử lý** (`Timeline` 5 chặng, chặng 5 = bốc thăm, đọc `boc_tham`):
   - chưa có lượt → "Chờ lịch bốc thăm";
   - chưa quay → "Lịch bốc thăm …" / "Đang mở — vào bốc thăm ngay";
   - đã quay → "Trúng căn X" / "Chưa trúng · dự phòng số N".
   - Bấm chặng 5 → phòng bốc thăm.
5. **Thông tin hồ sơ** (`KeyValueRow`): đợt, ngày tiếp nhận, số HS sao chép được.
6. **Thao tác** theo `quyen` máy chủ trả về:
   - Nháp: "Nộp hồ sơ" (primary; khoá + "còn thiếu n giấy tờ") · "Xoá hồ sơ" (danger, có xác nhận).
   - Cần bổ sung: "Bổ sung giấy tờ" (primary) → `giay-to`.
   - Trạng thái khác: không có nút.

### 5.6 Thông tin cá nhân (`noxh/ho-so/[id]/thong-tin`)

- Form gồm:
  - Họ tên*, Ngày sinh*, Giới tính* (chip Nam / Nữ);
  - CCCD* và SĐT* **khoá** (theo tài khoản), Ngày cấp, Nơi cấp, Email;
  - **Thường trú*** (Tỉnh/TP*, Phường/xã*, Địa chỉ chi tiết);
  - **Hiện tại** (checkbox "Giống địa chỉ thường trú");
  - **Loại căn hộ***.
- Chọn tỉnh, xã: ô chọn có tìm kiếm trong `Dialog`. Danh mục tỉnh/xã giả ở đợt này (TODO nguồn thật).
- Lỗi hiện ngay dưới ô. `FormErrorSummary` ở đầu form khi bấm lưu.
- Nháp lưu tạm trong bộ nhớ theo `ho_so_id`; xoá khi lưu xong, khi nộp hoặc khi đăng xuất (có CCCD/SĐT).
- `StickyActionBar` "Lưu và tiếp tục" → `giay-to`. Hồ sơ chỉ đọc → các ô ở dạng xem, không có thanh.

### 5.7 Giấy tờ (`noxh/ho-so/[id]/giay-to`)

- **Đầu màn**: thẻ tiến độ "Đã nộp a/b giấy tờ bắt buộc" + thanh tiến độ. Khi Cần bổ sung: Alert "Cần bổ sung n giấy tờ trước <hạn gần nhất>".
- **`DocumentRow`** cho mỗi giấy tờ:
  - tên, badge "Bắt buộc";
  - gợi ý "PDF, JPG, PNG · tối đa 5 MB";
  - badge trạng thái (Chưa nộp / Đã nộp / Hợp lệ / Chưa đạt yêu cầu);
  - hạn nộp (đỏ khi quá hạn);
  - lý do chưa đạt (khối `danger` pastel);
  - tệp đã nộp (tên + dung lượng) với Xem / Bỏ tệp.
- **Hành động mỗi dòng** (khi `quyen.sua_giay_to` chứa id dòng):
  - "Tải lên" mở hộp chọn nguồn: **Chụp ảnh** (`expo-image-picker`) · **Chọn ảnh** · **Chọn tệp** (`expo-document-picker`). Web chỉ có Chọn tệp.
  - "Tải mẫu" khi `co_mau`.
- **Kiểm tệp trước khi tải** (`validateNoxhFile`): đuôi theo `dinh_dang` (`.jpeg` coi như `jpg`), dung lượng ≤ `dung_luong_mb`, **chặn HEIC/HEIF** kèm hướng dẫn iPhone.
- **Đang tải**: dòng hiện thanh tiến độ, các nút khoá.
- **`StickyActionBar`**:
  - Nháp: "Nộp hồ sơ". Thiếu giấy tờ bắt buộc → khoá + "Còn thiếu n giấy tờ bắt buộc". Bấm → `Dialog` xác nhận (cam kết thông tin đúng sự thật) → `da-nop`.
  - Cần bổ sung: "Gửi bổ sung" → Toast "Đã gửi bổ sung" → chi tiết hồ sơ.

### 5.8 Đã nộp (`noxh/ho-so/[id]/da-nop`)

- `IconCircle` thành công cỡ hero, "Đã nộp hồ sơ", số HS sao chép được.
- 3 bước tiếp theo: Chủ đầu tư kiểm tra → Gửi Sở Xây dựng → Bốc thăm.
- Nút "Xem hồ sơ" (primary), "Về trang Nhà ở xã hội" (ghost).

### 5.9 Bốc thăm của tôi (`noxh/boc-tham/index`)

- Thẻ `LotteryCard` mỗi lượt: mã đợt, tên, dự án, số HS, nhóm · loại căn, khung giờ.
- Trạng thái tính theo giờ máy chủ (`lotteryPhase`):
  - **Sắp diễn ra**: đếm ngược;
  - **Đang mở**: nút "Bốc thăm ngay";
  - **Đã hết giờ, chờ công bố**;
  - **Đã quay**: kết quả rút gọn;
  - **Đã công bố**.
- Rỗng → "Bạn chưa có lượt bốc thăm. Hồ sơ được Sở Xây dựng chấp thuận sẽ được xếp lịch."

### 5.10 Phòng bốc thăm (`noxh/boc-tham/[id]`)

- **Thanh 3 bước**: Xác nhận → Bốc thăm → Kết quả.
- **Thông tin lượt**: đợt, dự án, số HS, nhóm, loại căn, khung giờ, `Countdown` khi chưa tới giờ.
- **Quy định**: khối gấp được + checkbox "Tôi đã đọc và đồng ý quy định".
- **`LotteryDrum`**: lồng cầu SVG xoay bằng reanimated, quay ít nhất 2,5 giây song song với lời gọi máy chủ, quá 20 giây thì huỷ.
  - Giảm chuyển động → không xoay, chỉ hiện "Đang bốc thăm…".
  - Vùng `aria-live` đọc "Đang bốc thăm…" và đọc kết quả.
- **Nút primary** "Bốc thăm": chỉ bật khi đã đồng ý và trong khung giờ. Chặn bấm đúp.
- **Lỗi**:
  - mất mạng → nút "Mất kết nối — Thử lại" (máy chủ trả cùng kết quả khi gọi lại);
  - "Chưa đến giờ bốc thăm" → khoá 15 giây có đếm lùi.
- **`LotteryResultCard`**:
  - Trúng: "Chúc mừng! Bạn đã trúng căn A-1205" + tòa, tầng, diện tích, số phòng ngủ.
  - Chưa trúng: "Rất tiếc, bạn chưa trúng · Dự phòng số N".
  - Nút "Xem giấy xác nhận" mở `Dialog` `LotteryCertificate`. Web có thêm nút In; native ghi gợi ý chụp màn hình. Xuất PDF để sau.
- **Bố cục**: mobile đặt khu bốc thăm lên đầu, ô đồng ý nằm ngay trên nút. Desktop hai cột 5/7 (trái thông tin + quy định, phải khu bốc thăm).

### 5.11 Kết quả đã công bố (`noxh/ket-qua`)

- Chọn đợt (chip / ô chọn), ô tìm theo số hồ sơ.
- Ô số liệu: tổng hồ sơ · số căn · số trúng.
- Danh sách thẻ trên mobile, `DataTable` từ 1024px: số HS, phiên, kết quả, căn / số dự phòng. Không có họ tên/CCCD (máy chủ không trả).
- Phân trang 20 dòng.

### 5.12 Thông báo

- `NotificationType` thêm `noxh_lottery`, `noxh_result`, `noxh_cancel`.
- `notificationService` gộp thông báo NOXH (mock; bản thật `fn_portal_noxh_thong_bao`) với thông báo thanh toán, sắp theo thời gian.
- Đánh dấu đã đọc với NOXH gọi `fn_portal_noxh_thong_bao_da_doc`; loại cũ giữ cách lưu trên máy.
- `notificationTypeMeta` thêm icon và tông cho 3 loại mới.

### 5.13 Trang chủ và Cá nhân

- **Trang chủ**:
  - Khi có việc cần làm NOXH (Cần bổ sung, bốc thăm Đang mở hoặc sắp mở trong 24 giờ): thêm thẻ nhắc `NoxhAttentionCard` (`Card sunken`, tông `warning` / `primary`) dưới 4 ô chức năng. Không có việc thì không hiện.
  - 4 ô chức năng giữ nguyên (ô Phiếu thu càng cần vì đã bỏ tab riêng).
- **Cá nhân**: dòng "Nhà ở xã hội" hiện "Đã kết nối" hoặc nút "Kết nối".

## 6. Dữ liệu và mã nguồn

Luồng giữ đúng quy tắc dự án: **màn → hooks → services → (mock | API)**.

| Tệp | Nội dung |
|---|---|
| `types/noxh.ts` | Kiểu khớp JSON `fn_portal_noxh_*`, giữ tên trường snake_case như web để nối thật không phải ánh xạ: `NoxhRound`, `NoxhRoundDetail`, `NoxhApplicationRow`, `NoxhApplicationDetail`, `NoxhDoc`, `NoxhQuyen`, `NoxhLotteryItem`, `NoxhSpinResult`, `NoxhPublishedLottery`, `NoxhOtpStart`, `NoxhLoaiCan` |
| `lib/noxh.ts` (thuần, có test) | `noxhStatusMeta` (nhãn + tông theo `portalStatus`), `docStatusMeta`, `roundStatus(round, now)`, `applicationSteps(detail)`, `processTimeline(detail, serverNow)`, `missingRequiredDocs`, `pickFeaturedApplication`, `noxhAttention`, `lotteryPhase(item, serverNow)`, `validateNoxhFile`, `formatCountdown`, `noxhLinkToHref`, `normalizeCccd`, `isValidCccd` |
| `services/noxhService.ts` | Hàm async, đúng chữ ký RPC: `getRounds`, `getRound`, `getLoaiCan`, `connectNoxh`, `getMyApplications`, `getApplication`, `saveApplication(payload, submit)`, `deleteApplication`, `uploadDoc`, `removeDoc`, `openDoc`, `sendSupplement`, `getMyLotteries`, `spinLottery`, `getPublishedResults`, `getNoxhNotifications`, `markNoxhNotificationsRead`. `PHIEN_HET_HAN` → `ServiceError('UNAUTHORIZED')` |
| `services/config.ts` | `NOXH_BACKEND: 'mock' \| 'api' = 'mock'` |
| `services/authService.ts`, `types/user.ts`, `lib/companySession.ts` | `CompanySession.token` tuỳ chọn + `noxh?`; đăng nhập nhận SĐT/CCCD, chọn `fn_portal_login` / `fn_portal_site_login` theo loại tài khoản (mục 3.1); dịch vụ hợp đồng bỏ qua công ty không có token hợp đồng; test `company-session` thêm ca tài khoản tự đăng ký |
| `data/mock/noxh.ts` | Dữ liệu giả (mục 7) — chỉ `services/` được đọc |
| `hooks/useNoxh*.ts` | `useNoxhRounds`, `useNoxhRound`, `useNoxhApplications`, `useNoxhApplication`, `useNoxhLotteries`, `useServerClock`, `useCountdown`, `usePublishedResults` (dựa trên `useAsync` sẵn có) |
| `components/domain/noxh/` | `RoundCard`, `ApplicationCard`, `NoxhStatusCard`, `StepList`, `ProcessTimeline`, `DocumentRow`, `UploadSourceSheet`, `LotteryCard`, `LotteryDrum`, `LotteryResultCard`, `LotteryCertificate`, `Countdown`, `ConnectNoxhDialog`, `NoxhAttentionCard`, `PickerDialog` |
| `components/domain/PaymentsSegment.tsx` | Thanh phân đoạn Thanh toán ↔ Phiếu thu |
| `theme/icons.ts` | Thêm: `idCard`, `upload`, `camera`, `image`, `trash`, `trophy`, `listChecks`, `book`, `mapPin`, `users`, `shieldCheck`, `timer`, `filePdf` (Phosphor) |
| `theme/tokens.json` | Thêm kích thước `lotteryDrum`, `roundImage` nếu cần — ghi vào MASTER.md |

Thư viện mới (cài bằng `npx expo install`): `expo-document-picker`, `expo-image-picker`. Trước khi viết code phải đọc tài liệu SDK 57 tương ứng.

## 7. Dữ liệu giả (đủ để xem mọi trạng thái)

Khách demo `0901 234 567` / `123456` (đã có trong mock), có cả token hợp đồng và token NOXH ở Sunshine Group.

Tài khoản demo thứ hai `0938 111 222` (CCCD `001099012345`, chị Lê Thu Hà) / `123456`: tự đăng ký qua website NOXH, **chỉ có token NOXH**. Đăng nhập được bằng SĐT hoặc CCCD; Hợp đồng/Thanh toán/Phiếu thu hiện màn rỗng; có 1 hồ sơ `MOI_TIEP_NHAN`.

| Đối tượng | Trạng thái giả |
|---|---|
| Đợt A "Nhà ở xã hội Hạ Long Bay — Đợt 1" | Đang mở (tính theo giờ hiện tại, còn 12 ngày) — khách chưa có hồ sơ → thử tạo, điền, tải tệp, nộp |
| Đợt B "NOXH Green River — Đợt 2" | Sắp mở (sau 5 ngày) |
| Đợt C "NOXH Sông Hồng — Đợt 1" (BlueSky Land) | Đang mở, ở công ty thứ hai của khách demo (chưa có token NOXH) → thử `ConnectNoxhDialog` từ nút Đăng ký hồ sơ |
| Hồ sơ 1 (dự án D) | `CAN_BO_SUNG`: 2 giấy tờ `CHUA_DAT` có lý do, 1 quá hạn → thử bổ sung → `DANG_THAM_DINH` |
| Hồ sơ 2 (dự án E) | `SXD_CHAP_THUAN` + lượt bốc thăm `DANG_MO` (khung giờ: bây giờ − 10 phút → + 2 giờ), kết quả định trước Trúng A-1205 |
| Hồ sơ 3 (dự án F, cũ) | `KHONG_DAT` có lý do (chỉ xem) |
| Lượt bốc thăm 2 | Đợt `DA_KHOA` sắp diễn ra (sau 2 ngày) của hồ sơ 2 ở phiên khác → xem đếm ngược |
| Kết quả công bố | 1 đợt `DA_CONG_BO`, 45 dòng, có phân trang |
| Thông báo NOXH | 1 lịch bốc thăm (chưa đọc), 1 huỷ đợt (đã đọc) |

- Mock giữ trạng thái trong bộ nhớ: nộp, bổ sung, quay thay đổi dữ liệu cho tới khi tải lại app.
- Mock dùng cùng luật như máy chủ (quyền theo trạng thái, thiếu giấy tờ bắt buộc thì không nộp được, quay lại cho cùng kết quả). Như vậy giao diện được thử với cùng các lỗi sẽ gặp khi chạy thật.
- Mật khẩu kết nối NOXH (mock): `123456`.

## 8. Lỗi và trường hợp biên

- **Phiên NOXH hết hạn** (`PHIEN_HET_HAN`): xoá token NOXH của công ty đó (không đăng xuất cả app) và hiện lại thẻ "Kết nối".
- **Lỗi nghiệp vụ** từ máy chủ: hiện đúng thông điệp tiếng Việt (Toast hoặc dưới ô). Ví dụ: "Chưa nộp giấy tờ bắt buộc: …" → chuyển tới `giay-to` và tô các dòng thiếu.
- **Đồng hồ**: mọi mốc bốc thăm so theo `server_now` (độ lệch = giờ máy chủ − giờ máy). Đếm ngược chạy ở máy. Tới giờ mở, chờ ngẫu nhiên ≤ 15 giây rồi tải lại một lần, không thăm dò liên tục.
- **App quay lại từ nền** khi đang ở phòng bốc thăm: tải lại lượt một lần.
- **Quyền**: chỉ bật nút theo `quyen` máy chủ trả về; app không tự suy quyền từ trạng thái, trừ trong mock.
- **Bảo mật**: CCCD/SĐT hiển thị che giữa theo dữ liệu máy chủ. Không ghi log CCCD. Mở tệp chỉ khi URL bắt đầu `https://`.

## 9. Kiểm thử

- `tests/noxh.test.cjs` (cùng cách `company-session.test.cjs`: transpile `lib/noxh.ts`) phủ:
  - `roundStatus`, `lotteryPhase` (biên đúng giây mở/đóng, lệch đồng hồ);
  - `applicationSteps`, `processTimeline`, `missingRequiredDocs`;
  - `validateNoxhFile` (`.jpeg`, HEIC, quá dung lượng, tên không đuôi);
  - `noxhLinkToHref`, `normalizeCccd`;
  - `pickFeaturedApplication`, `noxhAttention`.
- `tests/contrast.test.cjs` thêm cặp màu mới nếu có token mới.
- Thủ công: chạy `npm run web`, đi hết bảng mục 7 ở 375 và 1440px; `npm run audit:ui` không báo lỗi mới.

## 10. Thứ tự triển khai

| Giai đoạn | Việc |
|---|---|
| 0 | Thanh tab mới + `PaymentsSegment`; cập nhật MASTER §8, `pages/payments.md`, `pages/receipts.md` |
| 1 | `types/noxh.ts`, `lib/noxh.ts` + test, `data/mock/noxh.ts`, `services/noxhService.ts`, hooks, icon mới |
| 2 | Trang NOXH, Chi tiết đợt, Hướng dẫn, `ConnectNoxhDialog` |
| 3 | Tạo hồ sơ, Hồ sơ của tôi, Chi tiết hồ sơ, Thông tin cá nhân, Giấy tờ (cài picker), Đã nộp |
| 4 | Bốc thăm của tôi, Phòng bốc thăm, Kết quả công bố |
| 5 | Thông báo gộp, thẻ nhắc Trang chủ, dòng Cá nhân; xác thực: đăng nhập SĐT/CCCD + lấy token NOXH (`authService`, `CompanySession.noxh`, `token` tuỳ chọn), cập nhật `docs/auth-flow.md` |
| 6 (xong 2026-10-05, người dùng duyệt) | Nối API thật trong `services/noxhApi.ts` (đủ luồng như web, kể cả ghi); `NOXH_BACKEND` theo `AUTH_BACKEND`. Claude chỉ thử thật các hàm **đọc** (`dot_list`, `dot_get`, `loai_can`, `boc_tham_cong_bo` trên `brg-noxh`); hàm ghi kiểm bằng unit test với client giả, người phụ trách tự bấm thử trên app |

Mỗi giai đoạn: viết `design-system/beesky/pages/noxh-*.md` cho màn mới (chỉ ghi điểm khác Master), chạy `tsc`, `expo lint`, `npm test`.

## 11. Ngoài phạm vi đợt này

- Đăng ký tài khoản NOXH trong app (dùng tài khoản đăng nhập sẵn có — người dùng chốt 2026-10-05); đăng nhập VNeID; quét CCCD bằng ảnh.
- Thanh toán đặt cọc sau khi trúng (dự án con D phía web chưa có).
- Khách tự rút hồ sơ (máy chủ không cho).
- Xuất PDF giấy xác nhận; thông báo đẩy (push).
- Bảng bốc thăm trực tiếp (`LiveBoard`) và trang kiểm chứng: là màn trình chiếu công khai, đã có trên web — app chỉ liên kết mở web.
