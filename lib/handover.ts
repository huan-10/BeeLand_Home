/**
 * Bàn giao căn hộ ("Quỹ bàn giao" trên web) và lịch nhận nhà (`bg_lich_hen`) — logic thuần, có test `tests/handover.test.cjs`.
 */
import type { IconName, Tone } from '@/theme';
import type {
  AppointmentView,
  Handover,
  HandoverOverviewItem,
  HandoverSchedule,
  HandoverScheduleStatus,
  HandoverShift,
  HandoverSlots,
  HandoverStatus,
} from '@/types';

export type HandoverStepState = 'done' | 'current' | 'todo';

/* ---------------- Trạng thái bàn giao ---------------- */

const STATE_MAP: Record<string, HandoverStatus> = {
  PENDING: 'pending',
  NOTIFIED: 'notified',
  HANDING_OVER: 'handing_over',
  HANDED_OVER: 'handed_over',
  PAUSED: 'paused',
};

/** Cột `state` của `bee_handover_funds` → trạng thái app; giá trị lạ coi như chưa bàn giao. */
export function handoverStatusFromState(state: string | null | undefined): HandoverStatus {
  return STATE_MAP[String(state ?? '').trim().toUpperCase()] ?? 'pending';
}

/** Nhãn cho khách (web: Chờ bàn giao · Đã thông báo bàn giao · Đang bàn giao · Đã bàn giao · Tạm dừng bàn giao). */
export const handoverStatusMeta: Record<HandoverStatus, { label: string; tone: Tone; icon: IconName }> = {
  pending: { label: 'Chờ bàn giao', tone: 'neutral', icon: 'hourglass' },
  notified: { label: 'Đã thông báo bàn giao', tone: 'primary', icon: 'bellRing' },
  handing_over: { label: 'Đang bàn giao', tone: 'warning', icon: 'key' },
  handed_over: { label: 'Đã bàn giao', tone: 'success', icon: 'checkCircle' },
  paused: { label: 'Tạm dừng bàn giao', tone: 'danger', icon: 'warning' },
};

const STEP_LABELS = ['Chuẩn bị bàn giao', 'Đã thông báo', 'Đang bàn giao', 'Đã nhận nhà'] as const;
const STEP_INDEX: Record<HandoverStatus, number> = { pending: 0, notified: 1, handing_over: 2, paused: 2, handed_over: 4 };

/** 4 bước hiển thị cho khách. Tạm dừng: dừng ở bước "Đang bàn giao" (màn hình hiện thêm cảnh báo). */
export function handoverSteps(status: HandoverStatus): { label: string; state: HandoverStepState }[] {
  const at = STEP_INDEX[status];
  return STEP_LABELS.map((label, i) => ({ label, state: i < at ? 'done' : i === at ? 'current' : 'todo' }));
}

/** Căn đang có việc cần khách chú ý trước (đang / đã thông báo / tạm dừng), đã nhận nhà xuống cuối. */
const ORDER: Record<HandoverStatus, number> = { handing_over: 0, notified: 1, paused: 2, pending: 3, handed_over: 4 };
export function sortHandovers(items: Handover[]): Handover[] {
  return [...items].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.unitCode.localeCompare(b.unitCode, 'vi', { numeric: true }));
}

/* ---------------- Lịch bàn giao ---------------- */

/** Nhãn theo `_bg_lich_khach.trang_thai_ten` (web Lịch bàn giao). */
export const scheduleStatusMeta: Record<HandoverScheduleStatus, { label: string; tone: Tone; icon: IconName }> = {
  CHO_XAC_NHAN: { label: 'Chờ xác nhận', tone: 'warning', icon: 'hourglass' },
  DA_XAC_NHAN: { label: 'Đã xác nhận', tone: 'primary', icon: 'calendarCheck' },
  DANG_BAN_GIAO: { label: 'Đang bàn giao', tone: 'primary', icon: 'key' },
  DA_BAN_GIAO: { label: 'Đã bàn giao', tone: 'success', icon: 'checkCircle' },
  VANG_MAT: { label: 'Khách vắng mặt', tone: 'danger', icon: 'warning' },
  HOAN: { label: 'Hoãn', tone: 'danger', icon: 'warning' },
};

/** timestamptz / yyyy-MM-dd → ngày theo giờ Việt Nam (UTC+7). */
export function vnDate(value: string | null | undefined): string {
  const s = String(value ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return s.slice(0, 10);
  return new Date(t + 7 * 3600_000).toISOString().slice(0, 10);
}

const cleanNote = (s: string | null | undefined) => {
  const t = String(s ?? '').trim();
  return t === '—' || t === '-' ? '' : t;
};

const str = (s: string | null | undefined) => String(s ?? '').trim();
const num = (v: unknown): number | null => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

/** Một phần tử của `_bg_lich_khach` (trong `fn_portal_app_ban_giao`). */
export interface PortalScheduleRow {
  id: string;
  ban_giao_id: string;
  so_qbg: string | null;
  ky_hieu: string | null;
  lan: number | null;
  ngay: string | null;
  ca: string | null;
  tu_gio: string | null;
  den_gio: string | null;
  ca_id: string | null;
  dia_diem: string | null;
  trang_thai: string | null;
  trang_thai_ten: string | null;
  khach_dang_ky: boolean | null;
  nhan_vien: string | null;
  lien_he: string | null;
  so_tien_can_nop: number | string | null;
  bien_ban: { so_bb: string | null; ngay_ban_giao: string | null } | null;
}

const isScheduleStatus = (s: string): s is HandoverScheduleStatus => s in scheduleStatusMeta;

export function toSchedule(r: PortalScheduleRow): HandoverSchedule {
  const code = str(r.trang_thai).toUpperCase();
  const status: HandoverScheduleStatus = isScheduleStatus(code) ? code : 'CHO_XAC_NHAN';
  return {
    id: r.id,
    fundId: r.ban_giao_id,
    unitCode: str(r.ky_hieu),
    attempt: Number(r.lan) || 1,
    date: vnDate(r.ngay),
    shiftId: r.ca_id || null,
    timeSlot: str(r.ca),
    place: str(r.dia_diem),
    status,
    statusLabel: str(r.trang_thai_ten) || scheduleStatusMeta[status].label,
    staff: str(r.nhan_vien),
    contact: str(r.lien_he),
    amountDue: num(r.so_tien_can_nop),
    selfBooked: r.khach_dang_ky === true,
    record: r.bien_ban ? { code: str(r.bien_ban.so_bb), date: vnDate(r.bien_ban.ngay_ban_giao) } : null,
  };
}

/* ---------------- Khoảng đăng ký + khối "Lịch nhận nhà" ---------------- */

const dayMs = (date: string) => Date.parse(`${date}T00:00:00Z`);

/** Khoảng khách còn chọn được: [max(hôm nay, từ ngày), đến ngày]; `daysLeft` tính cả hôm nay và ngày cuối. */
export function bookingWindow(h: Pick<Handover, 'fromDate' | 'toDate'>, today: string): { from: string; to: string; daysLeft: number } | null {
  if (!h.fromDate || !h.toDate || h.toDate < today) return null;
  return { from: h.fromDate > today ? h.fromDate : today, to: h.toDate, daysLeft: Math.round((dayMs(h.toDate) - dayMs(today)) / 86_400_000) + 1 };
}

const ACTIVE: HandoverScheduleStatus[] = ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_BAN_GIAO'];
const newestFirst = (a: HandoverSchedule, b: HandoverSchedule) => b.date.localeCompare(a.date) || b.attempt - a.attempt;

/** `schedules` đã lọc theo căn (`fundId === h.id`). Tạm dừng > đã bàn giao > lịch hiệu lực > khoảng đăng ký. */
export function appointmentState(h: Handover, schedules: HandoverSchedule[], today: string): AppointmentView {
  const sorted = [...schedules].sort(newestFirst);
  const done = sorted.find((s) => s.status === 'DA_BAN_GIAO') ?? null;
  const live = sorted.find((s) => ACTIVE.includes(s.status)) ?? null;
  const previous = sorted.filter((s) => s.status === 'VANG_MAT' || s.status === 'HOAN');
  const window = bookingWindow(h, today);
  const view = (kind: AppointmentView['kind'], active: HandoverSchedule | null): AppointmentView => ({ kind, active, window, previous });
  if (h.status === 'paused') return view('paused', live);
  if (h.status === 'handed_over' || done) return view('handed_over', done);
  if (live) return view(live.status === 'CHO_XAC_NHAN' ? 'pending' : 'confirmed', live);
  if (!h.fromDate || !h.toDate || (h.status !== 'pending' && h.status !== 'notified')) return view('no_window', null);
  return view(window ? 'can_book' : 'expired', null);
}

/** Căn đang chờ khách chọn lịch lên đầu, còn lại theo `sortHandovers`. */
export function sortOverview(items: HandoverOverviewItem[]): HandoverOverviewItem[] {
  const rank = (x: HandoverOverviewItem) => (x.appointment.kind === 'can_book' ? 0 : 1);
  return [...items].sort(
    (a, b) => rank(a) - rank(b) || ORDER[a.status] - ORDER[b.status] || a.unitCode.localeCompare(b.unitCode, 'vi', { numeric: true }),
  );
}

/* ---------------- Màn chọn lịch ---------------- */

/** Lịch đang đổi: ngày + ca khách đang giữ (chỗ của chính khách được tính lại là còn). */
export interface HeldSlot {
  date: string;
  shiftId: string;
}

export function shiftsForDay(slots: HandoverSlots, date: string, keep?: HeldSlot): HandoverShift[] {
  const day = slots.days.find((d) => d.date === date);
  if (!day) return [];
  return day.shifts.map((s) => (keep && keep.date === date && keep.shiftId === s.id ? { ...s, remaining: s.remaining + 1 } : s));
}

const hasRoom = (slots: HandoverSlots, date: string, keep?: HeldSlot) => shiftsForDay(slots, date, keep).some((s) => s.remaining > 0);

export function dateStrip(
  slots: HandoverSlots,
  keep?: HeldSlot,
): { date: string; weekday: string; day: string; month: string; available: boolean }[] {
  return slots.days.map((d) => ({ date: d.date, ...scheduleDateParts(d.date), available: hasRoom(slots, d.date, keep) }));
}

/** Đổi lịch → ngày đang giữ (nếu còn trong khoảng); không thì ngày còn chỗ gần nhất. */
export function firstAvailableDate(slots: HandoverSlots, keep?: HeldSlot): string | null {
  if (keep && slots.days.some((d) => d.date === keep.date)) return keep.date;
  return slots.days.find((d) => hasRoom(slots, d.date))?.date ?? null;
}

/** Hôm nay theo giờ Việt Nam (yyyy-MM-dd). */
export function vnToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

/* ---------------- Quỹ bàn giao (dữ liệu thật) ---------------- */

/** Dòng `fn_handover_fund_list` (các khoá app dùng). */
export interface FundRow {
  id: string;
  so_qbg: string | null;
  state: string | null;
  khach_hang_id: string | null;
  phieu_giu_cho_id: string | null;
  ky_hieu: string | null;
  so_hdmb: string | null;
  tu_ngay: string | null;
  den_ngay: string | null;
  dien_tich_hd: number | null;
  dien_tich_bg: number | null;
  pt_tang_giam: number | null;
  pt_tien_do: number | null;
  pt_tien_do_pbt: number | null;
  ghi_chu: string | null;
}

/** Hợp đồng của khách dùng để ghép (id = phiếu giữ chỗ). */
export interface OwnedContract {
  id: string;
  code: string;
  unitCode: string;
  projectName: string;
  projectImageUrl?: string;
}

/**
 * Chỉ giữ quỹ bàn giao của ĐÚNG khách (`khach_hang_id`) VÀ thuộc một hợp đồng của khách (`phieu_giu_cho_id`) —
 * hàm liệt kê của nhân viên trả theo từ khoá nên có thể lẫn khách khác cùng mã căn.
 */
export function ownedHandovers(rows: FundRow[], customerId: string, contracts: Map<string, OwnedContract>): Handover[] {
  const seen = new Set<string>();
  const out: Handover[] = [];
  for (const r of rows) {
    const c = r.phieu_giu_cho_id ? contracts.get(r.phieu_giu_cho_id) : undefined;
    if (!c || r.khach_hang_id !== customerId || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push({
      id: r.id,
      code: String(r.so_qbg ?? '').trim(),
      status: handoverStatusFromState(r.state),
      contractId: c.id,
      contractCode: String(r.so_hdmb ?? '').trim() || c.code,
      unitCode: String(r.ky_hieu ?? '').trim() || c.unitCode,
      projectName: c.projectName,
      projectImageUrl: c.projectImageUrl,
      fromDate: vnDate(r.tu_ngay) || null,
      toDate: vnDate(r.den_ngay) || null,
      areaContract: num(r.dien_tich_hd),
      areaHandover: num(r.dien_tich_bg),
      areaDiffPercent: num(r.pt_tang_giam),
      // `pt_tien_do` / `pt_tien_do_pbt` là số nhân viên gõ tay trên web (mặc định 0), không phải tiền đã thu →
      // để trống; service điền tiến độ thật từ lịch thanh toán của hợp đồng (`scheduleProgress`).
      paymentPercent: null,
      maintenancePercent: null,
      note: cleanNote(r.ghi_chu),
    });
  }
  return out;
}

/* ---------------- Hiển thị ---------------- */

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/** Khối ngày trên thẻ lịch ("20" · "Th10" · "Thứ Ba") — đọc yyyy-MM-dd theo UTC để không lệch ngày. */
export function scheduleDateParts(date: string): { day: string; month: string; weekday: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return { day: '--', month: '', weekday: '' };
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return { day: m[3], month: `Th${Number(m[2])}`, weekday: WEEKDAYS[d.getUTCDay()] ?? '' };
}

/** Tối đa 2 chữ số thập phân, dấu phẩy thập phân (như `formatCompactCurrency`; không dùng toLocaleString vì Hermes). */
const vnNumber = (v: number) => (Math.round(v * 100) / 100).toString().replace('.', ',');

/** "98,6 m²". */
export function formatArea(v: number): string {
  return `${vnNumber(v)} m²`;
}

/** "+1,42%" / "−0,93%" / "0%". */
export function formatAreaDiff(v: number): string {
  if (v === 0) return '0%';
  return `${v > 0 ? '+' : '−'}${vnNumber(Math.abs(v))}%`;
}

/** Một đợt của `fn_contract_payment_schedule` (chỉ các cột tiền). */
export interface ScheduleMoneyRow {
  phai_thu: number | null;
  da_thu: number | null;
  phai_thu_pbt: number | null;
  da_thu_pbt: number | null;
}

const pct = (paid: number, due: number): number | null => (due > 0 ? Math.min(100, Math.max(0, (paid / due) * 100)) : null);

/** Tiến độ thật của hợp đồng: tiền gốc (đã thu / phải thu) và phí bảo trì riêng; hợp đồng không có PBT → null. */
export function scheduleProgress(rows: ScheduleMoneyRow[]): { paymentPercent: number | null; maintenancePercent: number | null } {
  const sum = (k: keyof ScheduleMoneyRow) => rows.reduce((t, r) => t + (Number(r[k]) || 0), 0);
  return { paymentPercent: pct(sum('da_thu'), sum('phai_thu')), maintenancePercent: pct(sum('da_thu_pbt'), sum('phai_thu_pbt')) };
}
