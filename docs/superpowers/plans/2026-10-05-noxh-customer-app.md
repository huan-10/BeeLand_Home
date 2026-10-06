# Nhà ở xã hội trong app khách hàng — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa toàn bộ phần việc của khách trong luồng NOXH (đợt nhận hồ sơ → hồ sơ → giấy tờ → nộp/bổ sung → bốc thăm → kết quả → thông báo) vào `beeland-app-KH`, chạy trên dữ liệu giả.

**Architecture:** Màn → hooks → `services/noxhService.ts` → `data/mock/noxh.ts` (khi `NOXH_BACKEND = 'mock'`). Logic thuần (nhãn trạng thái, bước, thời gian bốc thăm, kiểm tệp) nằm ở `lib/noxh.ts` và có test. Phiên công ty có thêm token NOXH (`CompanySession.noxh`). Tab mới `noxh` là một Stack; Phiếu thu gộp vào Thanh toán.

**Tech Stack:** Expo SDK 57, Expo Router, React Native 0.86, TypeScript strict, react-native-reanimated 4, react-native-svg, phosphor-react-native, `node --test` + `typescript.transpileModule` cho test.

**Spec:** `docs/superpowers/specs/2026-10-05-noxh-customer-app-design.md` — đọc cùng kế hoạch này. Số mục như "spec §5.7" trỏ vào spec.

## Global Constraints

- Quy tắc của `CLAUDE.md`: không `any`; không hex/rgba/pixel ngoài `theme/`; chữ qua `<Text variant>`; icon qua `<Icon name>`; `Pressable` import từ `@/components/ui`; màn không import `data/mock/`. Ba lệnh grep trong `CLAUDE.md` phải rỗng.
- Mọi việc giao diện theo quy trình 5 bước của `CLAUDE.md`: đọc MASTER.md → đọc/tạo `design-system/beesky/pages/<màn>.md` (chỉ ghi điểm khác Master) → tra `ui-ux-pro-max` → dùng token → tự kiểm §13.
- Bảng màu Xanh trời. Mỗi màn tối đa **một** nút primary và **một** thẻ nền ink.
- Toàn bộ chữ tiếng Việt. Nhãn trạng thái **đúng nguyên văn** bảng "Nhãn cho khách" của `../beeland/docs-claude/07-workflows/nha-o-xa-hoi.md`.
- Kiểu NOXH giữ tên trường snake_case như JSON `fn_portal_noxh_*` (spec §6).
- **Database chỉ đọc:** không chạy hàm ghi nào trên `api-beelandv2.beesky.vn`. `NOXH_BACKEND = 'mock'`; nhánh `api` của hàm ghi chỉ ném `ServiceError('Chức năng đang được kết nối máy chủ.')`.
- Thư viện native mới cài bằng `npx expo install`. Trước khi dùng API Expo nào, đọc `https://docs.expo.dev/versions/v57.0.0/`.
- `lib/noxh.ts` chỉ được `import type` (test transpile không phân giải alias `@/`). Hằng/hàm runtime phải tự chứa trong file.
- **Git:** working tree có sẵn nhiều thay đổi chưa commit của người dùng. Chỉ commit khi người dùng cho phép, và chỉ `git add` đúng file của task. Bước "Checkpoint" = chạy kiểm tra, không commit.
- Kiểm tra cuối mỗi task: `npx tsc --noEmit && npx expo lint && npm test`.

## Review Focus

1. **Lệch đồng hồ máy/máy chủ ở mốc bốc thăm:** máy khách nhanh 3 phút vẫn phải thấy "Sắp diễn ra" cho tới đúng `tu_ngay` theo giờ máy chủ, đúng giây mở là "Đang mở". → test `lotteryPhase` có `offsetMs` ở Task 3.
2. **Tệp từ iPhone (HEIC, `.JPG`, `.jpeg`, tên không đuôi, MIME rỗng trên web):** `.jpeg`/`.JPG` được nhận như `jpg`; HEIC bị chặn kèm hướng dẫn. → test `validateNoxhFile` ở Task 3.
3. **Bấm "Bốc thăm" hai lần / mất mạng giữa lúc quay:** chỉ một lời gọi; thử lại cho cùng kết quả. → test service mock `spinLottery` idempotent ở Task 4 + khoá nút ở Task 11.
4. **Phiên NOXH hết hạn giữa chừng:** không đăng xuất cả app, chỉ hiện lại thẻ "Kết nối". → test `isNoxhSessionExpired` ở Task 3, xử lý ở Task 5.
5. **Thông báo có link lạ hoặc thiếu** (`null`, `../`, `boc-tham/` rỗng): luôn ra `/noxh`, không điều hướng ra ngoài. → test `noxhLinkToHref` ở Task 3.

---

## Bản đồ tệp

| Tệp | Trách nhiệm | Task |
|---|---|---|
| `components/layout/navItems.ts` | Mục tab mới + `activeNavName` | 1 |
| `components/domain/PaymentsSegment.tsx` | Thanh "Lịch thanh toán \| Phiếu thu" | 1 |
| `app/(app)/noxh/_layout.tsx`, `app/(app)/noxh/index.tsx` | Stack + Trang NOXH | 1, 6 |
| `types/noxh.ts` | Kiểu dữ liệu NOXH | 2 |
| `lib/noxh.ts` | Logic thuần NOXH | 2, 3 |
| `tests/noxh.test.cjs`, `tests/nav-items.test.cjs` | Test | 1–3 |
| `data/mock/noxh.ts` | Dữ liệu giả | 4 |
| `services/noxhService.ts`, `services/session.ts`, `services/config.ts` | Truy cập dữ liệu NOXH + token NOXH | 4 |
| `hooks/useNoxh.ts`, `hooks/useServerClock.ts` | Hook | 4 |
| `services/authService.ts`, `contexts/AuthContext.tsx`, `types/user.ts`, `lib/companySession.ts` | Kết nối NOXH, đăng nhập SĐT/CCCD | 5, 13 |
| `components/domain/noxh/*` | Thẻ và khối nghiệp vụ NOXH | 5–12 |
| `app/(app)/noxh/**` | Các màn NOXH | 6–12 |
| `design-system/beesky/pages/noxh-*.md` | Quy chuẩn từng màn | theo task |

---

### Task 1: Thanh tab mới + gộp Phiếu thu vào Thanh toán

**Files:**
- Modify: `components/layout/navItems.ts`, `components/layout/AppNavigation.tsx`, `app/(app)/_layout.tsx`, `app/(app)/payments.tsx`, `app/(app)/receipts/index.tsx`, `components/domain/index.ts`
- Create: `components/domain/PaymentsSegment.tsx`, `app/(app)/noxh/_layout.tsx`, `app/(app)/noxh/index.tsx` (tạm: `Screen` + `ScreenHeader` "Nhà ở xã hội"), `tests/nav-items.test.cjs`
- Docs: `design-system/beesky/MASTER.md` §8, `design-system/beesky/pages/payments.md`, `pages/receipts.md`

**Interfaces:**
- Produces:
  - `NavItem['name']` thêm `'noxh'`;
  - `primaryNavItems` theo thứ tự `index, contracts, noxh, payments, profile`; mục `noxh` có `label: 'Nhà ở XH'`, `sidebarLabel: 'Nhà ở xã hội'`, `icon: 'building'`;
  - `activeNavName(routeName: string): NavItem['name'] | undefined` (`'receipts'` → `'payments'`, tên không có trong danh sách → `undefined`);
  - `<PaymentsSegment value: 'payments' | 'receipts' />`.

- [ ] **Step 1: Viết test `tests/nav-items.test.cjs`** (transpile `components/layout/navItems.ts` giống `company-session.test.cjs`):
  ```js
  assert.deepEqual(m.primaryNavItems.map((i) => i.name), ['index', 'contracts', 'noxh', 'payments', 'profile']);
  assert.equal(m.activeNavName('receipts'), 'payments');
  assert.equal(m.activeNavName('noxh'), 'noxh');
  assert.equal(m.activeNavName('contract/[id]'), undefined);
  ```
- [ ] **Step 2:** `npm test` → FAIL (`activeNavName is not a function`).
- [ ] **Step 3: Sửa `navItems.ts`** thêm `sidebarLabel?: string` vào `NavItem`, mục `noxh`, và `activeNavName`. Mục `receipts` bị bỏ khỏi `primaryNavItems`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Nối điều hướng.**
  - `AppNavigation`: dùng `activeNavName(activeName)` để tô viên kính và mục sidebar; sidebar hiện `sidebarLabel ?? label`.
  - `_layout.tsx`: thêm `<Tabs.Screen name="noxh" options={{ title: 'Nhà ở xã hội' }} />`; `receipts` thêm `href: null`.
  - `noxh/_layout.tsx` copy mẫu `contracts/_layout.tsx`.
- [ ] **Step 6: `PaymentsSegment`.** Dùng `Tabs` (`id="payments-segment"`, items `[{ key: 'payments', label: 'Lịch thanh toán' }, { key: 'receipts', label: 'Phiếu thu' }]`). Đổi tab → `router.navigate('/receipts')` hoặc `router.navigate('/payments')`. Đặt làm phần tử đầu của `sticky` trong cả hai màn.
- [ ] **Step 7: Docs.** MASTER §8: thanh tab mới, Phiếu thu nằm trong Thanh toán. `payments.md` và `receipts.md`: ghi thanh phân đoạn.
- [ ] **Step 8: Checkpoint.** `npx tsc --noEmit && npx expo lint && npm test`. `npm run web`: ở 375px thấy 5 icon, ô thứ 3 là tòa nhà; mở Phiếu thu thì tab Thanh toán sáng.

---

### Task 2: Kiểu dữ liệu NOXH + nhãn, bước, giấy tờ (`lib/noxh.ts` phần 1)

**Files:**
- Create: `types/noxh.ts`, `lib/noxh.ts`, `tests/noxh.test.cjs`
- Modify: `types/index.ts` (export `./noxh`)

**Interfaces:**
- Produces, trong `types/noxh.ts`. Tên trường copy từ `../beeland/src/pages/CustomerPortal/noxh/types.ts`; chỉ đổi tiền tố `Portal` → `Noxh`.
  - `NoxhStatus` = `'NHAP'|'MOI_TIEP_NHAN'|'DANG_THAM_DINH'|'CAN_BO_SUNG'|'DU_DIEU_KIEN'|'DA_GUI_SXD'|'SXD_CHAP_THUAN'|'KHONG_DAT'|'RUT_HO_SO'`.
  - `NoxhDocStatus` = `'CHUA_CUNG_CAP'|'CHO_THAM_DINH'|'DAT'|'CHUA_DAT'`.
  - `NoxhFormat` = `'pdf'|'doc'|'docx'|'jpg'|'png'|'xls'|'xlsx'`.
  - `NoxhRoundStatus` = `'CHUA_CONG_BO'|'SAP_MO'|'DANG_MO'|'DA_DONG'`.
  - `NoxhRound` (thêm `company_id: string`, `ten_chu_dau_tu: string`, `slug: string` cho gộp nhiều chủ đầu tư), `NoxhRoundGroup`, `NoxhRoundDetail`.
  - `NoxhAddress { tinh: string; xa: string; dia_chi: string }`, `NoxhCustomerSnapshot` (họ tên, ngày sinh, `gioi_tinh: 'NAM'|'NU'|''`, cccd, ngày cấp, nơi cấp, di_dong, email, `thuong_tru: NoxhAddress`, `hien_tai: NoxhAddress`).
  - `NoxhApplicationRow` (thêm `company_id`), `NoxhDoc`, `NoxhHistoryItem`, `NoxhQuyen`, `NoxhApplicationLottery`, `NoxhApplicationDetail` (thêm `company_id`), `NoxhSavePayload`, `NoxhSaveResult`, `NoxhLoaiCan`, `NoxhOtpStart`.
  - `NoxhLotteryStatus`, `NoxhLotteryUnit`, `NoxhSpinResult`, `NoxhLotteryItem` (thêm `company_id`), `NoxhLotteryMine`.
  - `NoxhPublishedRow { so_ho_so; thu_tu_phien; ket_qua; ky_hieu: string | null; thu_tu_du_phong: number | null }`, `NoxhPublishedLottery { bt_id; ma_dot; ten; ten_du_an; tong_ho_so; tong_can; rows: NoxhPublishedRow[] }`.
  - `NoxhNotification`.
- Produces, trong `lib/noxh.ts`:
  - `noxhStatusMeta: Record<NoxhStatus, { label: string; tone: Tone }>`
  - `docStatusMeta: Record<NoxhDocStatus, { label: string; tone: Tone }>`
  - `type StepState = 'done' | 'current' | 'todo'`
  - `applicationSteps(d: NoxhApplicationDetail): { key: 'thong_tin'|'giay_to'|'xac_minh'|'du_dieu_kien'; label: string; state: StepState }[]`
  - `missingRequiredDocs(docs: NoxhDoc[]): NoxhDoc[]` (bắt buộc và `tep_ten` rỗng)
  - `docsNeedingSupplement(docs: NoxhDoc[]): NoxhDoc[]` (`CHUA_DAT` hoặc bắt buộc `CHUA_CUNG_CAP`)
  - `docProgress(docs): { submitted: number; required: number }` (đếm trên giấy tờ bắt buộc)
  - `personalInfoMissing(s: NoxhCustomerSnapshot, loaiCanId: string | null | undefined): string[]` (nhãn tiếng Việt của ô còn thiếu)
  - `latestReason(d): string | null` (lý do của dòng lịch sử mới nhất)
  - `isActiveApplication(s: NoxhStatus): boolean` (khác `NHAP`/`KHONG_DAT`/`RUT_HO_SO`)
  - `applicationFilter(row, f: 'all'|'processing'|'supplement'|'done'): boolean`

Bảng giá trị bắt buộc (copy nguyên văn):

| Mã | Nhãn | Tông |
|---|---|---|
| NHAP | Chưa nộp | neutral |
| MOI_TIEP_NHAN | Đã nộp hồ sơ | success |
| DANG_THAM_DINH | Đang kiểm tra | primary |
| CAN_BO_SUNG | Cần bổ sung | warning |
| DU_DIEU_KIEN | Đã xác minh | success |
| DA_GUI_SXD | Đang chờ Sở Xây dựng | primary |
| SXD_CHAP_THUAN | Đủ điều kiện tham gia bốc thăm | success |
| KHONG_DAT | Không đạt | danger |
| RUT_HO_SO | Đã rút hồ sơ | neutral |

Giấy tờ: `CHUA_CUNG_CAP` Chưa nộp (neutral) · `CHO_THAM_DINH` Đã nộp (primary) · `DAT` Hợp lệ (success) · `CHUA_DAT` Chưa đạt yêu cầu (danger).

Luật `applicationSteps`:
- **thong_tin** = `done` khi `personalInfoMissing` rỗng, ngược lại `current`.
- **giay_to** = `done` khi `missingRequiredDocs` rỗng và không còn giấy tờ `CHUA_DAT`; `current` khi bước 1 đã xong; ngược lại `todo`.
- **xac_minh** = `done` khi trạng thái ∈ {DU_DIEU_KIEN, DA_GUI_SXD, SXD_CHAP_THUAN}; `current` khi ∈ {MOI_TIEP_NHAN, DANG_THAM_DINH, CAN_BO_SUNG}; còn lại (gồm NHAP) `todo`.
- **du_dieu_kien** = `done` khi SXD_CHAP_THUAN; `current` khi ∈ {DU_DIEU_KIEN, DA_GUI_SXD}; còn lại `todo`.

- [ ] **Step 1: Viết test** trong `tests/noxh.test.cjs` (helper `load('lib/noxh.ts')` giống `company-session.test.cjs`; fixture `detail(overrides)` dựng trong file test):
  - `noxhStatusMeta.SXD_CHAP_THUAN.label === 'Đủ điều kiện tham gia bốc thăm'`
  - `missingRequiredDocs` bỏ qua giấy tờ không bắt buộc và giấy tờ đã có `tep_ten`
  - `applicationSteps(detail({ trang_thai: 'NHAP', thông tin đủ, thiếu 1 giấy tờ bắt buộc }))` → states `['done','current','todo','todo']`
  - `applicationSteps(detail({ trang_thai: 'SXD_CHAP_THUAN' }))` → `['done','done','done','done']`
  - `personalInfoMissing` khi thiếu xã và loại căn → `['Phường/xã thường trú', 'Loại căn hộ']`
  - `latestReason` lấy `ly_do` theo `thoi_diem` mới nhất
  - `applicationFilter(row CAN_BO_SUNG, 'supplement') === true`, `(row KHONG_DAT, 'processing') === false`
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Viết `types/noxh.ts` và các hàm trên trong `lib/noxh.ts`.
- [ ] **Step 4:** `npm test` → PASS; `npx tsc --noEmit` sạch.
- [ ] **Step 5: Checkpoint.**

---

### Task 3: Thời gian, tệp, liên kết (`lib/noxh.ts` phần 2)

**Files:**
- Modify: `lib/noxh.ts`, `tests/noxh.test.cjs`

**Interfaces:**
- Produces:
  - `roundStatus(r: Pick<NoxhRound,'tu_ngay'|'den_ngay'> & { cong_bo?: boolean }, now: number): NoxhRoundStatus`
  - `roundDaysLeft(r, now): number` (số ngày còn tới `den_ngay`, làm tròn lên, không âm)
  - `type LotteryPhase = 'upcoming' | 'open' | 'ended' | 'spun' | 'published'`
  - `lotteryPhase(item: Pick<NoxhLotteryItem,'tu_ngay'|'den_ngay'|'trang_thai'|'da_quay'>, serverNow: number): LotteryPhase`. Thứ tự ưu tiên: `published` khi `DA_CONG_BO`; `spun` khi `da_quay`; `upcoming` khi `serverNow < tu_ngay`; `open` khi `tu_ngay ≤ serverNow < den_ngay`; còn lại `ended`. Trong khung giờ thì `open` **bất kể** `DA_KHOA` (R14 của web).
  - `serverClockOffset(serverNowIso: string, clientNow: number): number`
  - `formatCountdown(ms: number): string`: `'2 ngày 03:04:05'` khi ≥ 1 ngày, `'03:04:05'` khi dưới 1 ngày, `'00:00:00'` khi ≤ 0.
  - `type ProcessStep = { key: string; label: string; detail: string | null; state: StepState }`
  - `processTimeline(d: NoxhApplicationDetail, serverNow: number): ProcessStep[]`: 5 chặng `nop` "Nộp hồ sơ", `kiem_tra` "Chủ đầu tư kiểm tra", `xac_minh` "Xác minh đủ điều kiện", `sxd` "Sở Xây dựng chấp thuận", `boc_tham` "Tham gia bốc thăm". `detail` chặng 5 theo spec §5.5 mục 4:
    - "Chờ lịch bốc thăm" (SXD_CHAP_THUAN, chưa có lượt) / "Chưa cập nhật";
    - "Lịch bốc thăm: HH:mm dd/MM/yyyy" (upcoming);
    - "Đang mở — vào bốc thăm ngay" (open);
    - "Đã hết giờ, chờ công bố" (ended);
    - "Trúng căn X" / "Chưa trúng · dự phòng số N" (đã quay).
  - `pickFeaturedApplication(rows: NoxhApplicationRow[]): NoxhApplicationRow | null`. Ưu tiên `CAN_BO_SUNG` > `NHAP` > `SXD_CHAP_THUAN` > các trạng thái đang xử lý khác > `updated_at` mới nhất. Bỏ qua `KHONG_DAT`/`RUT_HO_SO` khi còn hồ sơ khác.
  - `type NoxhAttention = { kind: 'supplement' | 'lottery_open' | 'lottery_soon'; title: string; href: string } | null`
  - `noxhAttention(rows: NoxhApplicationRow[], lotteries: NoxhLotteryItem[], serverNow: number): NoxhAttention`. Thứ tự: lượt `open` chưa quay → lượt `upcoming` trong 24 giờ → hồ sơ `CAN_BO_SUNG`.
  - `type FileCheck = { ok: true; ext: NoxhFormat } | { ok: false; message: string }`
  - `validateNoxhFile(file: { name: string; size: number; type?: string | null }, formats: NoxhFormat[], maxMb: number): FileCheck`
  - `formatFileHint(formats, maxMb): string` → `'PDF, JPG, PNG · tối đa 5 MB'`
  - `noxhLinkToHref(link: string | null | undefined): string`: `boc-tham/<id>` → `/noxh/boc-tham/<id>`, `boc-tham` → `/noxh/boc-tham`, `ho-so/<id>` → `/noxh/ho-so/<id>`, còn lại → `/noxh`. `<id>` phải khớp `^[A-Za-z0-9-]+$`.
  - `normalizeCccd(v: string): string` (chỉ giữ chữ số), `isValidCccd(v): boolean` (đúng 12 số)
  - `isNoxhSessionExpired(error: unknown): boolean` (đúng khi `{ error: 'PHIEN_HET_HAN' }` hoặc `Error` có `message === 'PHIEN_HET_HAN'`)

Thông điệp `validateNoxhFile` (nguyên văn):
- sai đuôi/MIME: `Chỉ nhận tệp ${định dạng in hoa nối ", "}`
- HEIC/HEIF: `Ảnh HEIC chưa được hỗ trợ. Hãy chọn ảnh JPG/PNG (iPhone: Cài đặt › Camera › Định dạng › Tương thích nhất).`
- quá dung lượng: `Tệp vượt quá ${maxMb} MB`

Luật: `.jpeg` / `.JPG` coi là `jpg`. Tên không có dấu chấm → sai đuôi. Có `type` thì MIME phải khớp bảng `NOXH_MIME` (copy từ tài liệu web mục "Lưu tệp"). `type` rỗng thì chỉ kiểm đuôi.

- [ ] **Step 1: Viết test:**
  - `roundStatus` ở đúng ms `tu_ngay` → `'DANG_MO'`; 1 ms trước → `'SAP_MO'`; `cong_bo: false` → `'CHUA_CONG_BO'`.
  - Lệch đồng hồ: `const off = serverClockOffset('2026-10-05T10:00:00+07:00', Date.parse('2026-10-05T10:03:00+07:00'))`; `lotteryPhase({ tu_ngay: '2026-10-05T10:01:00+07:00', … }, clientNow + off)` → `'upcoming'`.
  - `lotteryPhase` trong khung giờ với `trang_thai: 'DA_KHOA'` → `'open'`; `da_quay: true` → `'spun'`; `DA_CONG_BO` → `'published'`.
  - `formatCountdown(90061000) === '1 ngày 01:01:01'`; `formatCountdown(-5) === '00:00:00'`.
  - `processTimeline` chặng 5 với `boc_tham` đã quay trúng `A-1205` → `detail === 'Trúng căn A-1205'`, `state === 'done'`.
  - `validateNoxhFile({ name: 'a.JPG', size: 1e6, type: 'image/jpeg' }, ['jpg'], 5).ok === true`; `name: 'IMG_1.heic'` → thông điệp HEIC; `name: 'scan'` → sai đuôi; `size: 6 * 1024 * 1024` với `maxMb: 5` → `'Tệp vượt quá 5 MB'`; `name: 'a.pdf', type: 'image/png'` → sai.
  - `noxhLinkToHref('boc-tham/abc-123') === '/noxh/boc-tham/abc-123'`; `noxhLinkToHref('../x') === '/noxh'`; `noxhLinkToHref(null) === '/noxh'`; `noxhLinkToHref('boc-tham/') === '/noxh'`.
  - `pickFeaturedApplication([KHONG_DAT mới, DANG_THAM_DINH cũ])` → hồ sơ DANG_THAM_DINH.
  - `noxhAttention` có lượt đang mở và hồ sơ cần bổ sung → `kind === 'lottery_open'`.
  - `isNoxhSessionExpired({ error: 'PHIEN_HET_HAN' }) === true`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Viết các hàm. Định dạng giờ trong `processTimeline` theo `Asia/Ho_Chi_Minh` bằng phép cộng +7 giờ thủ công. Không import `lib/format.ts`, vì test transpile không phân giải import.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Checkpoint.**

---

### Task 4: Dữ liệu giả, service, token NOXH trong phiên, hook

**Files:**
- Create: `data/mock/noxh.ts`, `services/noxhService.ts`, `hooks/useNoxh.ts`, `hooks/useServerClock.ts`, `tests/noxh-mock.test.cjs`
- Modify: `services/config.ts`, `services/session.ts`, `services/index.ts`, `types/user.ts`

**Interfaces:**
- Consumes: types + `lib/noxh.ts` (Task 2–3).
- Produces:
  - `types/user.ts`:
    - `CompanySession.noxh?: { slug: string; token: string }`;
    - `CompanySession.token?: string` (tuỳ chọn; xử lý lỗi TS phát sinh bằng `?? ''` ở chỗ chỉ đọc và lọc `undefined` trong `sessionTokens`);
    - `AuthSession.token?: string`.
  - `services/config.ts`: `export const NOXH_BACKEND: 'mock' | 'api' = 'mock'`.
  - `services/session.ts`:
    - `setActiveSession` còn lưu danh sách `NoxhLink { companyId: string; slug: string; token: string }` từ `sessionCompanies(session)`;
    - `getNoxhLinks(): NoxhLink[]`;
    - `hasNoxhLink(companyId?: string): boolean`;
    - `onNoxhSessionExpired(listener: (companyId: string) => void): () => void`;
    - `emitNoxhSessionExpired(companyId: string): void`.
  - `services/noxhService.ts`: mọi hàm `async`, có comment `// TODO: thay bằng gọi API/database thật`.

| Hàm | Trả về | Luật mock (giống máy chủ) |
|---|---|---|
| `getRounds()` | `NoxhRound[]` | Đợt `cong_bo` của các công ty trong phiên (`sessionCompanies`, kể cả công ty chưa có token NOXH), sắp: Đang mở → Sắp mở → Đã đóng |
| `getRound(id)` | `NoxhRoundDetail` | Không có → `ServiceError('Không tìm thấy đợt nhận hồ sơ','NOT_FOUND')` |
| `getLoaiCan(dotId)` | `NoxhLoaiCan[]` | Theo dự án của đợt |
| `getMyApplications()` | `NoxhApplicationRow[]` | Hồ sơ của mọi công ty trong `getNoxhLinks()`; chưa có link → `[]` |
| `getApplication(id)` | `NoxhApplicationDetail` | Có `quyen` tính theo bảng "Quyền của khách theo trạng thái" của tài liệu web |
| `saveApplication(payload: NoxhSavePayload, submit: boolean)` | `NoxhSaveResult` | Tạo mới: đợt phải Đang mở; đã có hồ sơ còn hiệu lực hoặc `NHAP` cùng dự án → `ServiceError('Bạn đã có hồ sơ tại dự án này','CONFLICT')` kèm `hoSoId` (`NoxhConflictError extends ServiceError { hoSoId }`). `submit`: thiếu thông tin → `ServiceError('Chưa đủ thông tin: <ds>')`; thiếu giấy tờ → `ServiceError('Chưa nộp giấy tờ bắt buộc: <tên>, …')`; thành công → `MOI_TIEP_NHAN`, ghi lịch sử |
| `deleteApplication(id)` | `void` | Chỉ `NHAP` |
| `uploadDoc(hoSoId, docId, file: { name; size; type?; uri })` | `NoxhDoc` | Chạy `validateNoxhFile`, kiểm `quyen.sua_giay_to`; gắn `tep_ten`, `tep_kich_thuoc`, `ngay_nop`, `trang_thai = 'CHO_THAM_DINH'`; độ trễ 800–1500 ms |
| `removeDoc(hoSoId, docId)` | `NoxhDoc` | Về `CHUA_CUNG_CAP` |
| `openDoc(hoSoId, docId, loai: 'tep' \| 'mau')` | `string \| null` | Mock → `null` (màn hiện Toast "Bản xem thử chưa có tệp thật") |
| `sendSupplement(hoSoId)` | `NoxhSaveResult` | Mọi giấy tờ bắt buộc chưa đạt phải có tệp mới → `DANG_THAM_DINH` |
| `getMyLotteries()` | `NoxhLotteryMine` | `server_now = new Date().toISOString()` |
| `spinLottery(btHoSoId)` | `NoxhSpinResult` | Ngoài khung giờ → `ServiceError('Chưa đến giờ bốc thăm')` / `('Đợt bốc thăm đã kết thúc')`. Gọi lại → **cùng** kết quả, `mo_luc` giữ lần đầu |
| `getPublishedResults()` | `NoxhPublishedLottery[]` | |
| `getNoxhNotifications()` | `NoxhNotification[]` | |
| `markNoxhNotificationsRead(ids: string[] \| null)` | `void` | |

  - Nhánh `api`: đọc gọi `rpc(...)` của `services/supabase/client.ts` với tên hàm thật; ghi ném `ServiceError('Chức năng đang được kết nối máy chủ.')`. `PHIEN_HET_HAN` (dùng `isNoxhSessionExpired`) → `emitNoxhSessionExpired(companyId)` + `ServiceError('Phiên Nhà ở xã hội đã hết hạn, vui lòng kết nối lại.','UNAUTHORIZED')`.
  - `hooks/useNoxh.ts` (dựa trên `useAsync`): `useNoxhRounds()`, `useNoxhRound(id)`, `useNoxhLoaiCan(dotId)`, `useNoxhApplications()`, `useNoxhApplication(id)`, `useNoxhLotteries()`, `usePublishedResults()`. Mỗi hook trả `AsyncState<T>`.
  - `hooks/useServerClock.ts`:
    - `useServerClock(serverNowIso?: string): { now: () => number }`;
    - `useTicker(enabled: boolean, intervalMs = 1000): number` (dừng khi app ở nền).

Dữ liệu giả lấy đúng bảng spec §7. Mốc giờ tính từ `Date.now()` lúc nạp module (hàm `rel(minutes)`). Công ty dùng `MOCK_COMPANIES` (`data/mock/user.ts`): Sunshine Group `slug: 'sunshine-noxh'`, BlueSky Land `slug: 'bluesky-noxh'`. Mỗi hồ sơ 8 giấy tờ theo danh mục mặc định của tài liệu web (mục "Nhóm đối tượng mặc định"), 5 MB, định dạng `['pdf','jpg','png']`.

- [ ] **Step 1: Viết `tests/noxh-mock.test.cjs`.** Transpile `lib/noxh.ts` + một hàm thuần mới `lib/noxh.ts → applicationQuyen(trang_thai, nguon, docs, roundOpen): NoxhQuyen` mà service dùng. Assert:
  - `NHAP` + `PORTAL` + đợt mở → `nop: true, xoa: true, sua_thong_tin: true`;
  - `CAN_BO_SUNG` → `sua_giay_to` chỉ chứa id giấy tờ `CHUA_DAT`/`CHUA_CUNG_CAP`, `gui_bo_sung: true`;
  - `DANG_THAM_DINH` → mọi quyền false, `sua_giay_to: []`.
- [ ] **Step 2:** `npm test` → FAIL; thêm `applicationQuyen` vào `lib/noxh.ts` → PASS.
- [ ] **Step 3:** Viết `data/mock/noxh.ts`, `services/noxhService.ts`, sửa `services/session.ts`, `types/user.ts`, `services/config.ts`, export ở `services/index.ts`.
- [ ] **Step 4:** Viết hai file hook.
- [ ] **Step 5: Checkpoint.** `npx tsc --noEmit && npx expo lint && npm test`; grep `data/mock` trong app/components/hooks rỗng.

---

### Task 5: Icon, component nền NOXH, kết nối NOXH

**Files:**
- Modify: `theme/icons.ts`, `theme/tokens.json` + `theme/sizes.ts` (nếu cần), `lib/labels.ts`, `services/authService.ts`, `contexts/AuthContext.tsx`, `components/domain/index.ts`
- Create trong `components/domain/noxh/`: `index.ts`, `Countdown.tsx`, `StepList.tsx`, `ProcessTimeline.tsx`, `NoxhStatusCard.tsx`, `ConnectNoxhDialog.tsx`, `NoxhConnectCard.tsx`

**Interfaces:**
- Consumes: Task 2–4.
- Produces:
  - Icon mới (spec §6): `idCard` (IdentificationCard), `upload` (UploadSimple), `camera` (Camera), `image` (Image), `trash` (Trash), `trophy` (Trophy), `listChecks` (ListChecks), `book` (BookOpenText), `mapPin` (MapPin), `users` (UsersThree), `shieldCheck` (ShieldCheck), `timer` (Timer), `filePdf` (FilePdf).
  - `authService.connectNoxh(session: AuthSession, password: string): Promise<AuthSession>`:
    - với mỗi công ty trong phiên có website `mau4` chưa có `noxh`, đăng nhập lấy token và gắn `noxh`;
    - mock: mật khẩu `123456` thì đúng, slug lấy từ bảng công ty ở `data/mock/noxh.ts` (export `MOCK_NOXH_SITES: Record<companyId, slug>`);
    - sai → `ServiceError('Mật khẩu không đúng', 'UNAUTHORIZED', 'password')`;
    - api: `fn_portal_site_login(slug, phone, password)` là RPC **đọc + tạo phiên**. Nhánh api để `ServiceError('Chức năng đang được kết nối máy chủ.')` cho tới Task 13.
  - `AuthContext`:
    - `connectNoxh(password: string): Promise<void>` (lưu phiên mới, gọi `setActiveSession`);
    - `noxhConnected: boolean` (= `hasNoxhLink()` của phiên);
    - lắng nghe `onNoxhSessionExpired` → bỏ `noxh` của công ty đó khỏi phiên.
  - `<Countdown targetMs: number; now: () => number; onElapsed?: () => void; label?: string />`: dùng `useTicker`, chữ `numeric`, `accessibilityLabel` "Còn …".
  - `<StepList steps: { label; state: StepState; onPress?: () => void; hint?: string }[] />`: icon `checkCircle` / số thứ tự / chấm rỗng **kèm chữ** "Đã xong" / "Đang thực hiện" / "Chưa tới".
  - `<ProcessTimeline steps: ProcessStep[]; onPressStep?: (key: string) => void />`
  - `<NoxhStatusCard row: Pick<NoxhApplicationRow,'so_ho_so'|'trang_thai'|'ten_du_an'|'ten_nhom'>; progress: number; footer?: ReactNode />`: thẻ nền ink bo 28, badge trạng thái, `ProgressBar onInverse`.
  - `<ConnectNoxhDialog visible; onClose; onConnected? />`: một ô Mật khẩu hiện tại; lỗi dưới ô; nút primary "Kết nối".
  - `<NoxhConnectCard onPress />`: thẻ trắng, `IconCircle shieldCheck`, "Kết nối tài khoản Nhà ở xã hội", mô tả "Dùng mật khẩu đăng nhập hiện tại để xem hồ sơ và bốc thăm."
  - `lib/labels.ts → noxhBadge(status: NoxhStatus): { label: string; tone: Tone }` (bọc `noxhStatusMeta`).

- [ ] **Step 1:** Thêm icon; `npx tsc --noEmit` sạch.
- [ ] **Step 2:** Viết `connectNoxh` (mock) + `AuthContext.connectNoxh`, `noxhConnected`, xử lý hết hạn.
- [ ] **Step 3:** Viết 6 component. Tra `ui-ux-pro-max`: `"stepper progress"` và `"countdown timer"` (`--domain ux`).
- [ ] **Step 4:** Tạo `design-system/beesky/pages/noxh-components.md` (thông số StepList, ProcessTimeline, NoxhStatusCard, Countdown — chỉ điểm khác Master).
- [ ] **Step 5: Checkpoint.**

---

### Task 6: Trang NOXH, Chi tiết đợt, Hướng dẫn

**Files:**
- Modify: `app/(app)/noxh/index.tsx`, `components/layout/Screen.tsx` (prop `scrollRef`)
- Create: `app/(app)/noxh/dot/[id].tsx`, `app/(app)/noxh/huong-dan.tsx`, `components/domain/noxh/RoundCard.tsx`, `components/domain/noxh/LotteryHighlightCard.tsx`, `design-system/beesky/pages/noxh-home.md`, `pages/noxh-round.md`

**Interfaces:**
- Consumes:
  - hooks `useNoxhRounds`, `useNoxhRound`, `useNoxhApplications`, `useNoxhLotteries`, `useServerClock`;
  - `pickFeaturedApplication`, `roundStatus`, `roundDaysLeft`, `lotteryPhase`;
  - `NoxhStatusCard`, `NoxhConnectCard`, `ConnectNoxhDialog`, `Countdown`.
- Produces:
  - `<RoundCard round: NoxhRound; now: number; onPress />`
  - `<LotteryHighlightCard item: NoxhLotteryItem; now: () => number; onPress />`

- [ ] **Step 1: Trang NOXH** đúng thứ tự spec §5.1:
  - lưới `Grid`/`Col`: mobile 12; desktop thẻ chính 7, thẻ bốc thăm/quy trình 5;
  - chuông dùng `useLatestNotifications`;
  - 4 `ActionTile` → `/noxh/ho-so`, `/noxh/boc-tham`, `/noxh/ket-qua`, `/noxh/huong-dan`;
  - nút "Xem đợt đang mở" cuộn tới Section đợt:
    - thêm prop tuỳ chọn `scrollRef?: RefObject<ScrollView | null>` vào `components/layout/Screen.tsx`, gắn vào ScrollView bên trong;
    - lấy `y` của Section qua `onLayout`;
    - gọi `scrollRef.current?.scrollTo({ y, animated: !reduceMotion })`.
- [ ] **Step 2: Chi tiết đợt** đúng spec §5.2:
  - "Đăng ký hồ sơ": `noxhConnected` và có link công ty của đợt → `/noxh/ho-so/tao?dot=<id>`;
  - công ty có trong phiên nhưng chưa có token NOXH → `ConnectNoxhDialog`. Đợt chỉ lấy từ công ty trong phiên (spec §3.3), nên không có nhánh "chưa có tài khoản".
  - Đã có hồ sơ cùng dự án (`getMyApplications` khớp `ten_du_an`/`dot_id`) → "Mở hồ sơ của bạn".
- [ ] **Step 3: Hướng dẫn**: nội dung tĩnh 4 khối, viết trong file màn:
  - quy trình 4 bước;
  - 11 nhóm đối tượng (danh sách ở tài liệu web, mục seed);
  - 8 giấy tờ cần chuẩn bị;
  - lưu ý ảnh chụp (rõ nét, đủ 4 góc, JPG/PNG/PDF ≤ 5 MB).
- [ ] **Step 4:** Tạo 2 file `pages/noxh-*.md`.
- [ ] **Step 5: Checkpoint** + chạy web:
  - demo chưa kết nối → thấy thẻ Kết nối;
  - nhập `123456` → thấy thẻ ink của Hồ sơ 1 (Cần bổ sung, vì được ưu tiên);
  - thấy thẻ bốc thăm Đang mở;
  - 3 đợt, đúng badge.

---

### Task 7: Tạo hồ sơ + Hồ sơ của tôi

**Files:**
- Create: `app/(app)/noxh/ho-so/index.tsx`, `app/(app)/noxh/ho-so/tao.tsx`, `components/domain/noxh/ApplicationCard.tsx`, `components/domain/noxh/ChoiceCard.tsx`, `design-system/beesky/pages/noxh-applications.md`

**Interfaces:**
- Consumes: `useNoxhRound`, `useNoxhLoaiCan`, `useNoxhApplications`, `saveApplication`, `NoxhConflictError`, `applicationFilter`, `docProgress`.
- Produces:
  - `<ApplicationCard row: NoxhApplicationRow; onPress />`
  - `<ChoiceCard title; description?; selected: boolean; onPress />`: `accessibilityRole="radio"`, `aria-checked`.

- [ ] **Step 1: Tạo hồ sơ** (spec §5.3).
  - Payload: `{ dot_id, nhom_doi_tuong_id, loai_can_id, khach_hang: { ho_ten, cccd, di_dong } }`. Lấy `ho_ten`, `cccd`, `di_dong` từ `user` của công ty đợt.
  - Thành công → `router.replace('/noxh/ho-so/<id>/thong-tin')`.
  - `NoxhConflictError` → Toast + `router.replace('/noxh/ho-so/<hoSoId>')`.
- [ ] **Step 2: Hồ sơ của tôi** (spec §5.4): `Screen top/sticky` với `ChipBar` 4 lọc; mỗi lọc có số đếm.
- [ ] **Step 3:** Tạo `pages/noxh-applications.md`.
- [ ] **Step 4: Checkpoint** + chạy web: tạo hồ sơ ở Đợt A → vào màn thông tin (màn này có ở Task 9; tạm thời màn trắng). Tạo lại → Toast trùng.

---

### Task 8: Chi tiết hồ sơ

**Files:**
- Create: `app/(app)/noxh/ho-so/[id]/_layout.tsx` (Stack), `app/(app)/noxh/ho-so/[id]/index.tsx`, `design-system/beesky/pages/noxh-application-detail.md`

**Interfaces:**
- Consumes: `useNoxhApplication`, `applicationSteps`, `processTimeline`, `latestReason`, `missingRequiredDocs`, `docProgress`, `saveApplication(…, true)`, `deleteApplication`, `StepList`, `ProcessTimeline`, `NoxhStatusCard`, `Dialog`.

- [ ] **Step 1:** Dựng màn đúng 6 khối spec §5.5:
  - Desktop: trái 5 cột (thẻ trạng thái + các bước, sticky không cần), phải 7 cột (alert, timeline, thông tin, thao tác).
  - Nộp ở đây: xác nhận `Dialog` "Tôi cam đoan thông tin kê khai là đúng sự thật" → `saveApplication({ id, … }, true)` → `router.replace('/noxh/ho-so/<id>/da-nop')`.
  - Lỗi "Chưa nộp giấy tờ bắt buộc" → `router.push('/noxh/ho-so/<id>/giay-to')`.
  - Xoá: `Dialog` xác nhận nút `danger` → `deleteApplication` → `router.replace('/noxh/ho-so')`.
  - Chặng 5 bấm được khi có `boc_tham` → `/noxh/boc-tham/<bt_ho_so_id>`.
- [ ] **Step 2:** Tạo file page.
- [ ] **Step 3: Checkpoint** + chạy web, kiểm 3 hồ sơ giả:
  - HS1: alert vàng có lý do, nút "Bổ sung giấy tờ";
  - HS2: chặng 5 "Đang mở — vào bốc thăm ngay";
  - HS3: alert đỏ, không có nút.

---

### Task 9: Thông tin cá nhân

**Files:**
- Create: `app/(app)/noxh/ho-so/[id]/thong-tin.tsx`, `components/domain/noxh/PickerDialog.tsx`, `components/domain/noxh/PersonalInfoForm.tsx`, `lib/noxhForm.ts`, `data/mock/provinces.ts`, `design-system/beesky/pages/noxh-personal-info.md`
- Modify: `services/noxhService.ts` (`getProvinces(): Promise<{ code; name }[]>`, `getWards(provinceCode): Promise<{ code; name }[]>`), `tests/noxh.test.cjs`

**Interfaces:**
- Produces:
  - `lib/noxhForm.ts` (thuần, có test):
    - `validatePersonalInfo(s: NoxhCustomerSnapshot, loaiCanId): Record<string, string>` (khoá = tên ô, giá trị = thông điệp; dựa trên `personalInfoMissing`; thêm kiểm email, ngày sinh không ở tương lai và ≥ 18 tuổi);
    - `copyAddress(from: NoxhAddress): NoxhAddress`.
  - `<PickerDialog title; items: { value: string; label: string }[]; value?: string; onSelect; onClose; visible />`: ô tìm kiếm, danh sách cuộn, hàng ≥ 44.
  - Nháp tạm: `Map<hoSoId, NoxhCustomerSnapshot>` trong module `services/noxhService.ts` (`getDraft`, `setDraft`, `clearDraft`, `clearAllDrafts`). `clearAllDrafts` được `AuthContext.signOut` gọi.

- [ ] **Step 1: Test** `validatePersonalInfo`:
  - thiếu `ho_ten` → `{ ho_ten: 'Vui lòng nhập họ tên' }`;
  - ngày sinh 2015 → `'Người đăng ký phải đủ 18 tuổi'`;
  - email `abc` → `'Email không hợp lệ'`.
  Chạy → FAIL.
- [ ] **Step 2:** Viết `lib/noxhForm.ts` → PASS.
- [ ] **Step 3:** Viết `PickerDialog`, `PersonalInfoForm`, màn (spec §5.6). Ngày sinh/ngày cấp nhập `dd/MM/yyyy` bằng `Input` có mặt nạ, không thêm thư viện date picker. Danh mục tỉnh mock 5 tỉnh × 3–4 xã, có `// TODO: nguồn danh mục tỉnh/xã thật`.
- [ ] **Step 4:** Tạo file page.
- [ ] **Step 5: Checkpoint** + chạy web: lưu khi thiếu → lỗi dưới ô + `FormErrorSummary`; lưu đủ → sang `giay-to`.

---

### Task 10: Giấy tờ + Đã nộp

**Files:**
- Create: `app/(app)/noxh/ho-so/[id]/giay-to.tsx`, `app/(app)/noxh/ho-so/[id]/da-nop.tsx`, `components/domain/noxh/DocumentRow.tsx`, `components/domain/noxh/UploadSourceSheet.tsx`, `lib/pickFile.ts`, `design-system/beesky/pages/noxh-documents.md`
- Modify: `package.json` (qua `npx expo install expo-document-picker expo-image-picker`), `app.json` (plugin `expo-image-picker` với `cameraPermission` / `photosPermission` tiếng Việt, theo tài liệu SDK 57)

**Interfaces:**
- Consumes: `uploadDoc`, `removeDoc`, `openDoc`, `sendSupplement`, `saveApplication(…, true)`, `validateNoxhFile`, `formatFileHint`, `docProgress`, `docsNeedingSupplement`.
- Produces:
  - `lib/pickFile.ts`: `pickFile(source: 'camera' | 'library' | 'document'): Promise<{ name: string; size: number; type: string | null; uri: string } | null>`. Huỷ → `null`. Thiếu quyền → `ServiceError('Ứng dụng chưa được cấp quyền dùng camera/ảnh. Vui lòng bật trong Cài đặt.')`.
  - `<DocumentRow doc: NoxhDoc; editable: boolean; uploading: boolean; onUpload; onView; onRemove; onTemplate? />`
  - `<UploadSourceSheet visible; onClose; onPick: (s: 'camera'|'library'|'document') => void />`: `Dialog` 3 lựa chọn; web chỉ có `document`.

- [ ] **Step 1:** Đọc tài liệu SDK 57 của `expo-document-picker`, `expo-image-picker`; cài bằng `npx expo install`; thêm plugin vào `app.json`.
- [ ] **Step 2:** Viết `lib/pickFile.ts` (ảnh từ camera đặt tên `anh-<timestamp>.jpg`, lấy `fileSize` từ kết quả picker).
- [ ] **Step 3:** Viết `DocumentRow`, `UploadSourceSheet`, màn Giấy tờ (spec §5.7):
  - Đang tải: `uploading` cho từng dòng, nút khác vẫn dùng được.
  - Lỗi kiểm tệp: hiện dưới dòng (`role="alert"`), không Toast.
- [ ] **Step 4:** Màn Đã nộp (spec §5.8).
- [ ] **Step 5:** Tạo file page.
- [ ] **Step 6: Checkpoint** + chạy web:
  - hồ sơ mới: tải đủ 7 giấy tờ bắt buộc → nút Nộp bật → xác nhận → màn Đã nộp → chi tiết hiện "Đã nộp hồ sơ";
  - HS1: tải lại 2 giấy tờ chưa đạt → "Gửi bổ sung" → "Đang kiểm tra";
  - tệp `.heic` → thông điệp HEIC.

---

### Task 11: Bốc thăm của tôi + Phòng bốc thăm

**Files:**
- Create: `app/(app)/noxh/boc-tham/_layout.tsx`, `app/(app)/noxh/boc-tham/index.tsx`, `app/(app)/noxh/boc-tham/[id].tsx`, `components/domain/noxh/LotteryCard.tsx`, `LotteryDrum.tsx`, `LotteryResultCard.tsx`, `LotteryCertificate.tsx`, `hooks/useLotterySpin.ts`, `design-system/beesky/pages/noxh-lottery.md`
- Modify: `theme/tokens.json` (`sizes.lotteryDrum`: 200 mobile / 260 rộng), MASTER §6

**Interfaces:**
- Consumes: `useNoxhLotteries`, `spinLottery`, `lotteryPhase`, `useServerClock`, `Countdown`.
- Produces:
  - `useLotterySpin(btHoSoId: string): { spin: () => Promise<void>; spinning: boolean; result: NoxhSpinResult | null; error: string | null; cooldown: number }`
    - chặn gọi khi `spinning`;
    - chạy song song `Promise.all([spinLottery(id), delay(2500)])` (giảm chuyển động → `delay(0)`);
    - quá 20 000 ms → lỗi `'Mất kết nối — Thử lại'`;
    - lỗi `'Chưa đến giờ bốc thăm'` → `cooldown` đếm 15 → 0 giây, thông điệp `'Ban tổ chức chưa mở đợt, vui lòng thử lại sau ít giây'`.
  - `<LotteryDrum spinning: boolean />`: SVG (`react-native-svg`) lồng tròn + 6 bi, xoay bằng `useSharedValue` + `withRepeat(withTiming)`; `useReducedMotion()` → đứng yên.
  - `<LotteryResultCard result: NoxhSpinResult; item: NoxhLotteryItem; onCertificate />`
  - `<LotteryCertificate visible; onClose; item; result />`: `Dialog`. Web có nút "In" gọi `window.print()` (bọc `Platform.OS === 'web'`).

- [ ] **Step 1: Test `tests/noxh-mock.test.cjs`** (bổ sung): `spinGuard(phase: LotteryPhase, agreed: boolean, spinning: boolean): boolean` trong `lib/noxh.ts`. Chỉ `true` khi `phase === 'open' && agreed && !spinning`. Chạy → FAIL → viết → PASS.
- [ ] **Step 2:** Viết `useLotterySpin`, `LotteryDrum`, `LotteryResultCard`, `LotteryCertificate`, `LotteryCard`.
- [ ] **Step 3: Màn danh sách** (spec §5.9): `LotteryCard` theo `lotteryPhase`. Tới giờ mở của lượt `upcoming` → chờ ngẫu nhiên ≤ 15 000 ms rồi `refetch()` một lần. App quay lại từ nền (`AppState` `active`) → `refetch()`.
- [ ] **Step 4: Phòng bốc thăm** (spec §5.10):
  - thanh 3 bước; vùng `accessibilityLiveRegion="polite"` + `aria-live`;
  - sau khi có kết quả, focus chuyển vào tiêu đề thẻ kết quả (`AccessibilityInfo.setAccessibilityFocus` native, `.focus()` web).
- [ ] **Step 5:** Tạo file page; thêm token, ghi MASTER §6.
- [ ] **Step 6: Checkpoint** + chạy web:
  - lượt 1: tick đồng ý → Bốc thăm → lồng quay ≥ 2,5 s → "Chúc mừng! Bạn đã trúng căn A-1205";
  - tải lại màn → vẫn kết quả đó;
  - lượt 2: đếm ngược, nút tắt;
  - bật giảm chuyển động → lồng không quay.

---

### Task 12: Kết quả công bố

**Files:**
- Create: `app/(app)/noxh/ket-qua.tsx`, `design-system/beesky/pages/noxh-results.md`
- Modify: `lib/noxh.ts` + test (`filterPublishedRows(rows, query: string): NoxhPublishedRow[]`, `paginate<T>(rows: T[], page: number, size = 20): { items: T[]; pages: number }`)

- [ ] **Step 1: Test:**
  - `filterPublishedRows` khớp một phần số hồ sơ, không phân biệt hoa thường, bỏ khoảng trắng;
  - `paginate(45 dòng, 3).items.length === 5`, `pages === 3`.
  FAIL → viết → PASS.
- [ ] **Step 2:** Màn (spec §5.11):
  - chọn đợt bằng `ChipBar` (≤ 4 đợt) hoặc `PickerDialog` (> 4);
  - ô tìm dùng `useDebouncedValue`;
  - `DataTable` khi `isDesktop`, thẻ khi hẹp;
  - nút Trang trước/sau.
- [ ] **Step 3:** Tạo file page. **Checkpoint.**

---

### Task 13: Thông báo, Trang chủ, Cá nhân, đăng nhập SĐT/CCCD + token NOXH

**Files:**
- Modify:
  - thông báo: `types/notification.ts`, `lib/labels.ts`, `services/notificationService.ts`, `app/(app)/notifications.tsx`;
  - Trang chủ / Cá nhân: `app/(app)/index.tsx`, `app/(app)/profile.tsx`;
  - đăng nhập: `services/authService.ts`, `services/supabase/portal.ts`, `lib/companySession.ts`, `data/mock/user.ts`, `app/login.tsx`, `lib/validation.ts`;
  - test và tài liệu: `tests/company-session.test.cjs`, `docs/auth-flow.md`, `design-system/beesky/pages/home.md`, `pages/profile.md`, `pages/login.md`.
- Create: `components/domain/noxh/NoxhAttentionCard.tsx`

**Interfaces:**
- Consumes: `getNoxhNotifications`, `markNoxhNotificationsRead`, `noxhLinkToHref`, `noxhAttention`, `connectNoxh`.
- Produces:
  - `NotificationType` thêm `'noxh_lottery' | 'noxh_result' | 'noxh_cancel'`; ánh xạ `LICH_BOC_THAM` / `KET_QUA_BOC_THAM` / `HUY_BOC_THAM`. `notificationTypeMeta`: `timer`/primary, `trophy`/success, `closeCircle`/danger. Id thông báo NOXH có tiền tố `noxh:`.
  - `lib/companySession.ts`:
    - `planCompanyLogins` nhận thêm `account.nguon_web_config_id?: string | null`, `account.pham_vi?: 'TAT_CA' | 'CHON'`;
    - `CompanyLoginPlan.siteLogin: { companyId; customerId; slug }[]` = tài khoản tự đăng ký qua website (đăng nhập bằng `fn_portal_site_login`), tách khỏi `login`;
    - `sessionTokens` gồm cả `noxh.token`.
  - `lib/validation.ts`: `parseLoginId(v: string): { kind: 'phone'; value: string } | { kind: 'cccd'; value: string } | null`.
  - `services/supabase/portal.ts`: `siteLogin(slug, login, password): Promise<PortalLoginRow>` (`fn_portal_site_login`; xử lý cả `{ error }`), `findCustomersByCccd(cccd)`, `getNoxhSites(companyIds: string[]): Promise<Record<string, string>>` (đọc `cloud_customer_web_configs` `template_code = 'mau4'` bằng service JWT — chỉ đọc).

- [ ] **Step 1: Test `company-session.test.cjs`:**
  - tài khoản `{ nguon_web_config_id: 'w1', pham_vi: 'CHON' }` → nằm trong `plan.siteLogin`, không ở `plan.login`;
  - `sessionTokens` gồm token NOXH;
  - `parseLoginId('001 099 012 345')` → `{ kind: 'cccd', value: '001099012345' }`; `parseLoginId('0938111222')` → phone.
  Chạy → FAIL.
- [ ] **Step 2:** Sửa `lib/companySession.ts`, `lib/validation.ts` → PASS.
- [ ] **Step 3: Đăng nhập.**
  - Mock: thêm khách `0938 111 222` / CCCD `001099012345` / "Lê Thu Hà" (Sunshine, chỉ token NOXH, hồ sơ `MOI_TIEP_NHAN` ở `data/mock/noxh.ts`); demo `0901 234 567` có cả hai token sau khi đăng nhập.
  - Api: theo spec §3.1. `fn_portal_site_login` / `fn_portal_login` là các hàm đăng nhập app đã dùng. **Không chạy thử** với tài khoản thật ngoài SĐT thử nghiệm trong `docs/auth-flow.md`.
  - `login.tsx`: nhãn ô "Số điện thoại hoặc CCCD", lỗi `'Nhập số điện thoại 10 số hoặc CCCD 12 số'`.
- [ ] **Step 4: Thông báo gộp** (spec §5.12). Bấm thông báo NOXH → `router.push(noxhLinkToHref(link))`.
- [ ] **Step 5: Trang chủ và Cá nhân.**
  - Trang chủ: `NoxhAttentionCard` dưới 4 ô khi `noxhAttention(...) !== null`. Lỗi tải NOXH thì ẩn thẻ, không làm hỏng Trang chủ.
  - Cá nhân: dòng "Nhà ở xã hội" (spec §5.13).
  - Công ty chỉ có token NOXH: `getContracts`/`getReceipts` trả `[]`; màn rỗng dùng câu ở spec §3.1.
- [ ] **Step 6:** Cập nhật `docs/auth-flow.md` (mục mới "Tài khoản NOXH = cùng tài khoản", hai token, R21) và 3 file page.
- [ ] **Step 7: Checkpoint** + chạy web:
  - đăng nhập `001099012345` / `123456` → Hợp đồng rỗng đúng câu; tab NOXH có hồ sơ "Đã nộp hồ sơ";
  - demo: chuông có thông báo lịch bốc thăm → bấm mở phòng bốc thăm.

---

### Task 14: Kiểm định toàn bộ

**Files:**
- Modify: `README.md` (mục NOXH: 2 tài khoản demo, mật khẩu kết nối `123456`), `CLAUDE.md` (danh sách file page có thêm `noxh-*`), `design-system/beesky/MASTER.md` (dòng "Dự án": thêm nhà ở xã hội)

- [ ] **Step 1:** Ba lệnh grep trong `CLAUDE.md` → rỗng.
- [ ] **Step 2:** `npx tsc --noEmit && npx expo lint && npm test && EXPO_OFFLINE=1 npx expo export --platform web` → đều đạt.
- [ ] **Step 3:** `npm run web` + `npm run audit:ui` → không lỗi mới. Nếu `scripts/ui-audit.js` có danh sách màn, thêm các route `/noxh/**`.
- [ ] **Step 4:** Đi tay hết bảng spec §7 ở 375px và 1440px; ghi kết quả vào mô tả PR, hoặc báo người dùng nếu chưa được commit.
- [ ] **Step 5:** `npx expo-doctor` không có lỗi mới (sau khi thêm 2 thư viện picker).
