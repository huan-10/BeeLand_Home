# Khách tự đăng ký lịch nhận nhà — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khách xem khoảng bàn giao và tự đăng ký / đổi / huỷ lịch nhận nhà trên app khách; lịch ghi thẳng vào `bg_lich_hen` nên web thấy ngay; app gộp "Bàn giao căn hộ" + "Lịch bàn giao" thành một màn.

**Architecture:** 4 hàm máy chủ mới `fn_portal_app_bg_*` (token phiên khách, chỉ THÊM, dùng lại `_bg_kiem_ca`, `_bg_sau_doi_lich`, `_bg_huy_nhac`) + thêm khoá ở `_bg_lich_khach` / `fn_bg_lich_list`. Web chỉ thêm nhãn "Khách tự đăng ký". App: logic thuần ở `lib/handover.ts`, service mock + thật, thẻ căn có khối "Lịch nhận nhà", màn chọn lịch mới.

**Tech Stack:** PostgreSQL / Supabase self-host (plpgsql), web React + Vite + antd (vitest), app Expo SDK 57 + expo-router + NativeWind (node:test).

**Spec:** `beeland-app-KH/docs/superpowers/specs/2026-10-16-ban-giao-dang-ky-lich-design.md`

## Global Constraints

- Máy chủ: chỉ THÊM hàm mới; với hàm có sẵn chỉ thêm khoá trả về (`_bg_lich_khach`, `fn_bg_lich_list`) — lấy định nghĩa thật bằng `pg_get_functiondef` trước khi sửa, không tin bản trong repo. Mọi hàm mới: `SECURITY DEFINER`, `SET search_path TO 'public'`, công ty + khách từ `_portal_app_ctx(p_token)`; lỗi nghiệp vụ trả `{error: '<tiếng Việt>'}` (không RAISE); `GRANT EXECUTE … TO anon, authenticated, service_role`, `REVOKE … FROM PUBLIC`.
- Ngày theo giờ VN: `(x AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`; hôm nay = `public._gcn_hom_nay()`.
- Khoảng đăng ký = `[max(hôm nay, tu_ngay VN), den_ngay VN]`, tối đa 92 ngày; thiếu `tu_ngay`/`den_ngay` ⇒ `"Chưa có thời gian bàn giao"`.
- Lịch hiệu lực = `trang_thai IN ('CHO_XAC_NHAN','DA_XAC_NHAN','DANG_BAN_GIAO')`; quỹ đặt được khi `state IN ('PENDING','NOTIFIED')`.
- Lịch sử: `KH_DANG_KY`, `KH_DOI_LICH`, `KH_HUY`; lịch "do khách tạo" = có dòng `bg_lich_su.hanh_dong = 'KH_DANG_KY'` của lịch đó. Huỷ: `ly_do = 'Khách huỷ trên app'`.
- Migration ở `beeland/supabase/migrations/`, tên `20261016100000_portal_bg_dang_ky.sql` (đặt sau migration mới nhất trên DB lúc làm; nếu DB đã có version lớn hơn thì tăng giờ). Áp: chạy thử BEGIN…ROLLBACK → sao lưu định nghĩa cũ vào `~/backups/20261016_bg_*.sql` → áp + ghi `supabase_migrations.schema_migrations`.
- Web: nhánh `devhuan`, commit local, không push.
- App-KH: repo đang có thay đổi chưa commit của người khác — chỉ `git add` file của task; không `any`; không hex / px ngoài `theme/`; chữ qua `<Text>`, icon qua `<Icon>`; màn chỉ gọi hooks / services; tiền/ngày qua `lib/format.ts`; quy trình giao diện của `CLAUDE.md` (MASTER.md → pages/*.md → `ui-ux-pro-max`).
- Chữ hiển thị (cố định): "Chọn lịch nhận nhà", "Nhận nhà từ dd/MM – dd/MM", "Còn N ngày để chọn lịch", "Chủ đầu tư sẽ thông báo thời gian bàn giao", "Chờ xác nhận", "Chủ đầu tư sẽ xác nhận và báo địa điểm", "Đổi lịch", "Huỷ lịch", "Cần thanh toán trước buổi nhận", "Cần đổi lịch? Gọi …", "Đã qua thời gian đăng ký", "Xác nhận đăng ký", "Đổi sang lịch này", "Đã gửi đăng ký — chủ đầu tư sẽ xác nhận", "Huỷ lịch nhận nhà ngày dd/MM?", "Đã huỷ lịch", "Các ngày đều đã kín", "Kín", "Còn n chỗ", "Khách tự đăng ký" (web).

## Review Focus

1. **Hai khách cùng giành chỗ cuối của một ca** — người sau phải nhận lỗi "… đã đủ khách", không ghi vượt sức chứa (khoá advisory trong `_bg_kiem_ca`). Test ở Task 1.
2. **Ranh giới ngày giờ VN** — `den_ngay` lưu `2026-10-15 17:00+00` (= 16/10 VN) phải cho đặt ngày 16/10; hôm nay sau 08:00 không còn ca 08:00. Test ở Task 1 và Task 3.
3. **Đổi lịch trong cùng ca đang kín** — khách giữ chỗ của chính mình (ca hiện tại phải hiện "Còn ≥ 1 chỗ" và đổi sang chính ngày/ca đó không bị báo kín). Test ở Task 1 và Task 3.
4. **Lịch nhân viên đã xếp hoặc đã xác nhận** — app không hiện nút Đổi / Huỷ, máy chủ từ chối dù gọi trực tiếp. Test ở Task 1 và Task 3.
5. **Quỹ đã có lịch rồi khách bấm đăng ký lại (2 thiết bị)** — lần sau bị từ chối "Quỹ đã có lịch hẹn hiệu lực", app tải lại và hiện lịch đang có. Test ở Task 1; app xử lý ở Task 6.

---

### Task 1: Máy chủ — hàm đăng ký / đổi / huỷ / ca trống cho khách

**Files:**
- Create: `beeland/supabase/migrations/20261016100000_portal_bg_dang_ky.sql`
- Create: `beeland/supabase/tests/bg_16_khach_dang_ky.sql`
- Modify (cùng migration): `_bg_lich_khach`, `fn_bg_lich_list` — chỉ thêm khoá

**Interfaces:**
- Produces (JSON trả cho app):
  - `fn_portal_app_bg_ca(p_token text, p_ban_giao_id uuid) → {data:{tu:date, den:date, ngay:[{ngay:date, ca:[{ca_id, ten, tu_gio, den_gio, so_khach, con}]}]}} | {error}`
  - `fn_portal_app_bg_dang_ky(p_token text, p_ban_giao_id uuid, p_ngay date, p_ca_id uuid) → {data:{id}} | {error}`
  - `fn_portal_app_bg_doi(p_token text, p_lich_id uuid, p_ngay date, p_ca_id uuid) → {data:{id}} | {error}`
  - `fn_portal_app_bg_huy(p_token text, p_lich_id uuid) → {data:{id}} | {error}`
  - `_bg_lich_khach` thêm khoá `ca_id`, `khach_dang_ky` (bool); `fn_bg_lich_list` thêm `khach_dang_ky` mỗi dòng.

- [ ] **Step 1: Viết test `bg_16_khach_dang_ky.sql`** theo kiểu `bg_12_lich_khach.sql` (chạy sau `gcn_fixtures.sql bg_fixtures.sql`, kết thúc `ROLLBACK;`). Tạo tài khoản + phiên portal cho khách của f1 và của f3 (`cloud_portal_accounts` `pham_vi='TAT_CA'`, `is_active`; `cloud_portal_sessions` `token` 'tok-bg16-f1' / 'tok-bg16-f3', `expires_at = now()+interval '1 hour'`, `web_config_id` NULL; xem `\d` hai bảng cho cột bắt buộc). Đặt `tu_ngay = hn - 1`, `den_ngay = (hn + 5)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'` cho f1. Các ASSERT:
  - `bg_ca(tok f1, f1)`: `tu = hn`, `den = hn+5`, 6 ngày; ca `BG_CA_KHAC` không có; `con` ca sáng = 2.
  - Đăng ký `hn+2` ca sáng ⇒ `data.id`; `bg_lich_hen` `CHO_XAC_NHAN`, `lan = 1`, `dia_diem` NULL; `bg_lich_su` có `KH_DANG_KY`; `_bg_lich_khach(...)->0->>'khach_dang_ky' = 'true'`, có `ca_id`; `fn_bg_lich_list` (as staff) dòng đó `khach_dang_ky = true`.
  - Đăng ký lại f1 ⇒ error "Quỹ đã có lịch hẹn hiệu lực".
  - Ngày `hn+6` / `hn-1` ⇒ error chứa "ngoài thời gian bàn giao"; `p_ngay = hn` + ca có `tu_gio` ≤ giờ hiện tại VN ⇒ error "Ca đã bắt đầu" (bỏ qua ASSERT nếu chạy trước 08:00).
  - Token f3 với quỹ f1 ⇒ error "Không tìm thấy căn bàn giao"; token 'het-han' ⇒ error chứa "hết hạn"; quỹ `fp_fund` (PAUSED) của khách ⇒ error chứa "tạm dừng".
  - Sức chứa: ca chiều (`so_khach = 1`) — khách f3 đăng ký f3 `hn+2` ca chiều OK; f1 đổi sang `hn+2` ca chiều ⇒ error chứa "đã đủ khách".
  - Đổi f1 sang `hn+3` ca sáng ⇒ OK, ghi `KH_DOI_LICH`; đổi sang chính ngày/ca hiện tại ⇒ OK (giữ chỗ của chính lịch).
  - Lịch do nhân viên xếp (`fn_bg_xep_lich` cho f2 với khách f1 nếu fixture cùng khách; nếu không thì dùng f3) ⇒ `bg_doi` / `bg_huy` error "Lịch do chủ đầu tư sắp xếp — vui lòng liên hệ để thay đổi".
  - Nhân viên `fn_bg_chuyen([lịch f1], 'XAC_NHAN')` ⇒ khách `bg_huy` error "Lịch đã được xác nhận — vui lòng liên hệ để thay đổi".
  - Lịch mới `CHO_XAC_NHAN` khác của f1 (huỷ lịch đã xác nhận bằng nhân viên trước) ⇒ `bg_huy` OK: `trang_thai = 'HUY'`, `ly_do = 'Khách huỷ trên app'`, lịch sử `KH_HUY`, tin `CHO` của lịch bị huỷ.
  - Quyền: `has_function_privilege('anon', 'public.fn_portal_app_bg_dang_ky(text,uuid,date,uuid)', 'execute')`.

- [ ] **Step 2: Chạy test, thấy FAIL** — `cd beeland/supabase/tests && cat gcn_fixtures.sql bg_fixtures.sql bg_16_khach_dang_ky.sql | ssh ai-claude@101.99.38.242 "docker exec -i supabase-db psql -U supabase_admin -d postgres -X -q -v ON_ERROR_STOP=1"` (dùng ASKPASS như các lần trước). Expected: lỗi "function fn_portal_app_bg_ca … does not exist".

- [ ] **Step 3: Viết migration.** Hàm phụ `_portal_bg_khoang(p_f bee_handover_funds) RETURNS TABLE(tu date, den date)` (service_role). `fn_portal_app_bg_ca` dựng `generate_series(tu, den, '1 day')` × ca hợp lệ (điều kiện như `fn_bg_ca_trong`), `con = greatest(0, so_khach − số lịch hiệu lực cùng ngày + ca)`, hôm nay bỏ ca `tu_gio <= to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh','HH24:MI')`. `_dang_ky`: khoá quỹ `FOR UPDATE` → kiểm theo thứ tự (thuộc khách → state → lịch hiệu lực → khoảng → ca đã bắt đầu → `_bg_kiem_ca(tenant, ngày, ca, 1)`) → insert lịch (`lan = max+1`, `nguoi_nhap_id` NULL) + `bg_lich_su(KH_DANG_KY, du_lieu {ngay, ca_id}, nguoi_ten = tên khách)`. `_doi`: khoá lịch rồi quỹ (thứ tự như `fn_bg_chuyen`) → kiểm thuộc khách, do khách tạo, `CHO_XAC_NHAN`, ngày hẹn ≥ hôm nay, quỹ không `PAUSED`/`HANDED_OVER`, khoảng, `_bg_kiem_ca(…, 1, p_lich_id)` → update ngày + ca, `KH_DOI_LICH`, nếu `da_gui_thong_bao_luc` IS NOT NULL ⇒ `PERFORM _bg_sau_doi_lich(tenant, lich)`. `_huy`: cùng kiểm (trừ khoảng / ca) → `HUY`, `ly_do`, `KH_HUY`, `PERFORM _bg_huy_nhac(tenant, lich)`. `_bg_lich_khach` + `fn_bg_lich_list`: lấy định nghĩa thật, thêm `'ca_id', l.ca_id` và `'khach_dang_ky', EXISTS(SELECT 1 FROM bg_lich_su h WHERE h.lich_hen_id = l.id AND h.hanh_dong = 'KH_DANG_KY')`.

- [ ] **Step 4: Chạy migration trong BEGIN…ROLLBACK rồi chạy test, thấy PASS** (thêm migration vào trước test trong cùng phiên psql: `cat gcn_fixtures.sql bg_fixtures.sql ../migrations/20261016100000_portal_bg_dang_ky.sql bg_16_khach_dang_ky.sql`). Expected: `NOTICE: bg_16_khach_dang_ky OK`. Chạy lại `bg_12_lich_khach.sql` cũng OK.

- [ ] **Step 5: Sao lưu + áp thật** — `pg_get_functiondef` của `_bg_lich_khach`, `fn_bg_lich_list` vào `~/backups/20261016_bg_*.sql`; áp migration trong 1 transaction + insert `schema_migrations`. Expected: `select ... from pg_proc where proname like 'fn_portal_app_bg_%'` trả 4 hàm. Nếu lệnh áp bị chặn, đưa người dùng lệnh như lần 2026-10-15.

- [ ] **Step 6: Commit (repo web, nhánh `devhuan`)** — `git add supabase/migrations/20261016100000_portal_bg_dang_ky.sql supabase/tests/bg_16_khach_dang_ky.sql && git commit -m "feat(ban-giao): khách tự đăng ký lịch nhận nhà (fn_portal_app_bg_*)"`.

### Task 2: Web — nhãn "Khách tự đăng ký" + tài liệu

**Files:**
- Modify: `beeland/src/pages/contracts/ban-giao/lich-ban-giao/types.ts` (`BgLichRow.khach_dang_ky?: boolean`)
- Modify: `beeland/src/pages/contracts/ban-giao/lich-ban-giao/columns.tsx` (cột "Trạng thái")
- Modify: `beeland/src/pages/contracts/ban-giao/lich-ban-giao/LichCalendarView.tsx` nếu thẻ lịch có badge trạng thái
- Modify: `beeland/docs-claude/07-workflows/ban-giao-quyet-toan.md` (mục "App khách hàng"), `beeland/docs-claude/09-decisions.md` (KD1–KD5)
- Test: `beeland/src/pages/contracts/ban-giao/lich-ban-giao/__tests__/helpers.test.ts`

**Interfaces:**
- Consumes: `fn_bg_lich_list` dòng có `khach_dang_ky` (Task 1).
- Produces: `nhanNguonLich(row: Pick<BgLichRow,'khach_dang_ky'>): string | null` trong `helpers.ts` (trả "Khách tự đăng ký" hoặc null).

- [ ] **Step 1: Test** `nhanNguonLich({khach_dang_ky:true}) === "Khách tự đăng ký"`, `false`/thiếu ⇒ `null`.
- [ ] **Step 2: Chạy `npx vitest run src/pages/contracts/ban-giao/lich-ban-giao`**, thấy FAIL.
- [ ] **Step 3: Thêm `nhanNguonLich`**; cột Trạng thái hiện `<Tag color="blue" className="m-0">{nhãn}</Tag>` cạnh `TrangThaiBadge` khi có nhãn (cùng chỗ thẻ "Đã báo"); lịch dạng lịch tháng hiện nhãn tương tự nếu có badge. Tài liệu: mô tả 4 hàm, khoảng đăng ký, quy tắc đổi/huỷ, nhãn lịch sử mới.
- [ ] **Step 4: `npx vitest run src/pages/contracts/ban-giao` PASS; `npx tsc --noEmit -p tsconfig.app.json` không lỗi mới; `npm run build` OK.**
- [ ] **Step 5: Commit** `feat(ban-giao): nhãn lịch khách tự đăng ký trên màn Lịch bàn giao`.

### Task 3: App — kiểu dữ liệu + logic thuần

**Files:**
- Modify: `beeland-app-KH/types/handover.ts`
- Modify: `beeland-app-KH/lib/handover.ts` (bỏ `ScheduleRow`, `OwnedKeys`, `matchSchedules`, `scheduleStatusFromText`, `toSchedule` cũ, `splitSchedules`)
- Test: `beeland-app-KH/tests/handover.test.cjs` (bỏ test của hàm đã xoá, thêm test mới)

**Interfaces:**
- Produces:
  - `type HandoverScheduleStatus = 'CHO_XAC_NHAN' | 'DA_XAC_NHAN' | 'DANG_BAN_GIAO' | 'DA_BAN_GIAO' | 'VANG_MAT' | 'HOAN'`
  - `interface HandoverSchedule { id; fundId; unitCode; attempt: number; date: string; shiftId: string | null; timeSlot: string; place: string; status: HandoverScheduleStatus; statusLabel: string; staff: string; contact: string; amountDue: number | null; selfBooked: boolean; record: { code: string; date: string } | null }`
  - `interface HandoverShift { id: string; name: string; from: string; to: string; capacity: number; remaining: number }`, `interface HandoverSlots { from: string; to: string; days: { date: string; shifts: HandoverShift[] }[] }`
  - `type AppointmentKind = 'no_window' | 'can_book' | 'pending' | 'confirmed' | 'handed_over' | 'expired' | 'paused'`
  - `interface AppointmentView { kind: AppointmentKind; active: HandoverSchedule | null; window: { from: string; to: string; daysLeft: number } | null; previous: HandoverSchedule[] }`
  - `interface HandoverOverviewItem extends Handover { appointment: AppointmentView }`, `interface HandoverOverview { items: HandoverOverviewItem[]; hotline: string }`
  - `interface PortalScheduleRow` = khoá của `_bg_lich_khach` (Task 1)
  - `toSchedule(r: PortalScheduleRow): HandoverSchedule`
  - `scheduleStatusMeta: Record<HandoverScheduleStatus, { label; tone; icon }>` (vàng / xanh / xanh / xanh lá / đỏ / đỏ)
  - `bookingWindow(h: Pick<Handover,'fromDate'|'toDate'>, today: string): { from; to; daysLeft } | null`
  - `appointmentState(h: Handover, schedules: HandoverSchedule[], today: string): AppointmentView` (schedules đã lọc theo `fundId === h.id`)
  - `sortOverview(items: HandoverOverviewItem[]): HandoverOverviewItem[]` (`can_book` lên đầu, còn lại theo `sortHandovers`)
  - `dateStrip(slots: HandoverSlots, keep?: { date: string; shiftId: string }): { date; weekday; day; month; available: boolean }[]`
  - `shiftsForDay(slots: HandoverSlots, date: string, keep?: { date: string; shiftId: string }): HandoverShift[]` (ca đang giữ của lịch đang đổi: `remaining + 1`)
  - `firstAvailableDate(slots: HandoverSlots, keep?: …): string | null` (đổi lịch ⇒ ngày đang giữ)

- [ ] **Step 1: Viết test** (giá trị cụ thể, `today = '2026-10-16'`):
  - `toSchedule` từ một dòng `_bg_lich_khach` đầy đủ: `timeSlot '08:00–10:00'`, `amountDue` số, `record` khi có `bien_ban`, `selfBooked` true/false.
  - `bookingWindow({fromDate:'2026-10-10', toDate:'2026-10-20'}, today)` ⇒ `{from:'2026-10-16', to:'2026-10-20', daysLeft:5}`; `toDate < today` ⇒ null; thiếu ngày ⇒ null.
  - `appointmentState`: 7 tình huống của spec §6.2 (paused ưu tiên; quỹ `HANDED_OVER` + lịch có `record` ⇒ `handed_over`; lịch `HOAN` cũ vào `previous`, quỹ PENDING còn khoảng ⇒ `can_book`; `CHO_XAC_NHAN` ⇒ `pending`; `DA_XAC_NHAN`/`DANG_BAN_GIAO` ⇒ `confirmed`; hết khoảng không lịch ⇒ `expired`; thiếu khoảng ⇒ `no_window`).
  - `sortOverview` đưa `can_book` lên đầu.
  - `dateStrip`: ngày mọi ca `remaining 0` ⇒ `available false`; `keep` làm ngày đang giữ `available true` dù kín; `weekday 'Thứ Sáu'` cho `2026-10-16`.
  - `shiftsForDay` với `keep` cộng 1 đúng ca; `firstAvailableDate` bỏ ngày kín, trả ngày đang giữ khi có `keep`.
- [ ] **Step 2: `npm test` FAIL** (hàm chưa có).
- [ ] **Step 3: Viết kiểu + hàm** trong 2 file trên (giữ `handoverStatusFromState`, `handoverStatusMeta`, `handoverSteps`, `sortHandovers`, `vnDate`, `vnToday`, `ownedHandovers`, `scheduleDateParts`, `formatArea*`, `scheduleProgress`).
- [ ] **Step 4: `npm test` PASS; `npx tsc --noEmit`** chỉ còn lỗi ở chỗ dùng hàm đã xoá (sửa ở Task 4–5).
- [ ] **Step 5: Commit** `feat(ban-giao): logic lịch nhận nhà theo lịch hẹn mới (bg_lich_hen)`.

### Task 4: App — service + mock + hook

**Files:**
- Modify: `beeland-app-KH/services/supabase/handover.ts`, `services/handoverService.ts`, `services/index.ts`, `hooks/useHandover.ts`, `data/mock/handover.ts`

**Interfaces:**
- Consumes: Task 1 RPC; Task 3 `toSchedule`, `appointmentState`, `sortOverview`, kiểu.
- Produces (services, đều `async`, ném `ServiceError` tiếng Việt với `{error}` của máy chủ):
  - `getHandoverOverview(): Promise<HandoverOverview>` (thay `getHandovers` + `getHandoverSchedules`)
  - `getHandoverSlots(fundId: string): Promise<HandoverSlots>`
  - `bookHandover(fundId: string, date: string, shiftId: string): Promise<void>`
  - `rescheduleHandover(scheduleId: string, date: string, shiftId: string): Promise<void>`
  - `cancelHandover(scheduleId: string): Promise<void>`
  - Hooks: `useHandoverOverview()` (kiểu trả như hook hiện có: `data, loading, refreshing, error, refetch`), `useHandoverSlots(fundId: string | undefined)`.

- [ ] **Step 1:** Bản thật: `fn_portal_app_ban_giao` → `quy` qua `ownedHandovers` + `withRealProgress` (giữ), `lich` qua `toSchedule` (bỏ lọc `ma_ctdk_uid` / `matchSchedules`), ghép theo `fundId`, `appointmentState(…, vnToday())`, `sortOverview`; hotline = `getSellerCompany()?.dien_thoai`. 4 hàm còn lại gọi RPC Task 1 với `p_token: requirePortalToken()`; `{error}` chứa "hết hạn" ⇒ `ServiceError(…, 'UNAUTHORIZED')`.
- [ ] **Step 2:** Bản mock (`AUTH_BACKEND = 'mock'`): mock lịch theo cấu trúc mới (một căn `can_book`, một `pending` tự đặt, một `confirmed`, một `handed_over`), slot 10 ngày × 4 ca có 1 ngày kín; book/reschedule/cancel sửa mảng mock trong bộ nhớ.
- [ ] **Step 3: `npx tsc --noEmit`** chỉ còn lỗi ở màn (Task 5); `grep -rn "data/mock" app components hooks contexts lib` rỗng.
- [ ] **Step 4: Commit** `feat(ban-giao): service đăng ký / đổi / huỷ lịch nhận nhà`.

### Task 5: App — màn Bàn giao gộp + khối "Lịch nhận nhà"

**Files:**
- Create: `beeland-app-KH/components/domain/handover/HandoverAppointment.tsx`
- Modify: `components/domain/handover/HandoverCard.tsx` (nhận `appointment`, chèn khối dưới `HandoverStepper`, bỏ nút "Xem lịch bàn giao"), `components/domain/handover/HandoverScheduleCard.tsx` (xoá nếu không còn dùng, cập nhật `components/domain/index.ts`)
- Modify: `app/(app)/ban-giao.tsx` (dùng `useHandoverOverview`, bỏ section "Lịch bàn giao sắp tới"), `app/(app)/lich-ban-giao.tsx` → `<Redirect href="/ban-giao" />`, `lib/appModules.ts` (bỏ `handover-schedule`)
- Modify: `design-system/beesky/pages/handover.md`; `pages/handover-schedule.md` ghi "Đã gộp vào handover.md (2026-10-16)"

**Interfaces:**
- Consumes: `HandoverOverviewItem`, `AppointmentView`, `scheduleStatusMeta`, `scheduleDateParts`, `formatCurrency` (`lib/format.ts`), `cancelHandover`.
- Produces: `HandoverAppointment({ view: AppointmentView, hotline: string, onBook(): void, onReschedule(s: HandoverSchedule): void, onCancel(s: HandoverSchedule): void })`.

- [ ] **Step 1:** Đọc MASTER.md + `pages/handover.md`; tra `ui-ux-pro-max` ("appointment status card", "date chip strip mobile").
- [ ] **Step 2:** `HandoverAppointment` vẽ 7 tình huống spec §6.2 bằng `Card`/`NoxhAlert`/`Badge`/`Button` sẵn có; khối ngày dùng `scheduleDateParts` + `sizes.scheduleDate`; `pending` + `selfBooked` ⇒ "Đổi lịch" (secondary) / "Huỷ lịch" (danger); `pending` không tự đặt hoặc `confirmed` ⇒ nút gọi `tel:` hotline / `lien_he`; dòng `previous`.
- [ ] **Step 3:** Màn `ban-giao`: Huỷ dùng `Dialog` "Huỷ lịch nhận nhà ngày dd/MM?" → `cancelHandover` (chống bấm lặp bằng ref + `loading`) → toast "Đã huỷ lịch" → `refetch`; Chọn/Đổi ⇒ `router.push({ pathname: '/ban-giao/chon-lich', params: { id, lich? } })`; làm mới khi quay lại màn (`useFocusEffect`).
- [ ] **Step 4:** `npx tsc --noEmit && npx expo lint && npm test` PASS; 3 lệnh grep trong `CLAUDE.md` rỗng.
- [ ] **Step 5: Commit** `feat(ban-giao): gộp Bàn giao căn hộ + Lịch bàn giao, khối lịch nhận nhà`.

### Task 6: App — màn chọn lịch

**Files:**
- Create: `beeland-app-KH/app/(app)/ban-giao/chon-lich.tsx` (nếu `ban-giao` đang là file đơn: chuyển `app/(app)/ban-giao.tsx` → `app/(app)/ban-giao/index.tsx`, sửa `Tabs.Screen` trong `app/(app)/_layout.tsx` cho đúng tên route), `components/domain/handover/DateStrip.tsx`, `components/domain/handover/ShiftOption.tsx`
- Create: `design-system/beesky/pages/handover-booking.md`; cập nhật danh sách page trong `CLAUDE.md` (thêm `handover-booking`)

**Interfaces:**
- Consumes: `useHandoverSlots`, `dateStrip`, `shiftsForDay`, `firstAvailableDate`, `bookHandover`, `rescheduleHandover`, `useHandoverOverview` (lấy căn + lịch đang đổi theo `id`/`lich`).
- Produces: route `/ban-giao/chon-lich?id=<quỹ>[&lich=<lịch>]`.

- [ ] **Step 1:** Dựng màn theo spec §6.3: `ScreenHeader` + dải thông tin khoảng; `DateStrip` (ScrollView ngang, chip ngày, chấm xanh / "Kín" mờ không bấm được, `accessibilityState.selected`); danh sách `ShiftOption` (radio, khoá ca kín); `StickyActionBar` tóm tắt + nút; skeleton khi tải; `EmptyState` "Các ngày đều đã kín" + gọi hotline.
- [ ] **Step 2:** Gửi: ref chống bấm lặp + `loading`; thành công ⇒ toast "Đã gửi đăng ký — chủ đầu tư sẽ xác nhận" (đổi lịch: "Đã đổi lịch nhận nhà") → `router.back()`; lỗi ⇒ toast lỗi máy chủ + `refetch` slot, giữ ngày đã chọn; lỗi "Quỹ đã có lịch hẹn hiệu lực" ⇒ quay lại màn Bàn giao (Review Focus 5).
- [ ] **Step 3:** Kiểm MASTER §13 (375/768/1024, vùng chạm ≥ 44, trợ năng đọc ngày "Thứ Ba 21 tháng 10, còn chỗ").
- [ ] **Step 4:** `npx tsc --noEmit && npx expo lint && npm test && npx expo export --platform web` PASS; grep `CLAUDE.md` rỗng.
- [ ] **Step 5: Commit** `feat(ban-giao): màn chọn lịch nhận nhà`.

### Task 7: Tài liệu dữ liệu + kiểm tay

**Files:**
- Modify: `beeland-app-KH/docs/real-data.md` (4 hàm ghi mới, lịch đọc theo `bg_lich_hen`), `beeland-app-KH/CLAUDE.md` mục "Database thật — CHỈ ĐỌC": thêm ngoại lệ "khách tự đăng ký / đổi / huỷ lịch nhận nhà qua `fn_portal_app_bg_*` (người dùng duyệt 2026-10-16)", `docs/database.md` nếu liệt kê hàm.

- [ ] **Step 1:** Viết tài liệu như trên.
- [ ] **Step 2:** Chạy lại toàn bộ kiểm tra app + `bg_12`/`bg_16` trên máy chủ (ROLLBACK).
- [ ] **Step 3:** Gửi người dùng danh sách kiểm tay (spec §7): đăng ký → web nhãn "Khách tự đăng ký" → đổi → huỷ → đăng ký lại → nhân viên xác nhận + địa điểm → app hiện địa điểm, mất nút Đổi/Huỷ → nhân viên gửi thông báo.
- [ ] **Step 4: Commit** `docs(ban-giao): dữ liệu thật + ngoại lệ ghi lịch nhận nhà`.
