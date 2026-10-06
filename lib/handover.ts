/**
 * Bàn giao căn hộ ("Quỹ bàn giao" trên web) và lịch bàn giao — logic thuần, có test `tests/handover.test.cjs`.
 */
import type { IconName, Tone } from '@/theme';
import type { Handover, HandoverSchedule, HandoverScheduleStatus, HandoverStatus } from '@/types';

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

const fold = (s: string | null | undefined) =>
  String(s ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** `trang_thai` lưu chữ trên web: Chờ xác nhận · Đã xác nhận · Đã bàn giao · Hoãn lịch. */
export function scheduleStatusFromText(text: string | null | undefined): HandoverScheduleStatus {
  const t = fold(text);
  if (t === 'đã xác nhận') return 'confirmed';
  if (t === 'đã bàn giao') return 'done';
  if (t === 'hoãn lịch') return 'postponed';
  return 'pending';
}

export const scheduleStatusMeta: Record<HandoverScheduleStatus, { label: string; tone: Tone; icon: IconName }> = {
  pending: { label: 'Chờ xác nhận', tone: 'warning', icon: 'clock' },
  confirmed: { label: 'Đã xác nhận', tone: 'primary', icon: 'calendarCheck' },
  done: { label: 'Đã bàn giao', tone: 'success', icon: 'checkCircle' },
  postponed: { label: 'Hoãn lịch', tone: 'danger', icon: 'warning' },
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

/** Dòng `bee_handover_schedules` (chỉ các cột app đọc). */
export interface ScheduleRow {
  id: string;
  so_hdmb: string | null;
  ma_sp: string | null;
  du_an: string | null;
  ten_kh: string | null;
  dien_thoai: string | null;
  ngay_ban_giao: string | null;
  khung_gio: string | null;
  hinh_thuc: string | null;
  nhan_vien: string | null;
  trang_thai: string | null;
  ghi_chu: string | null;
}

export interface OwnedKeys {
  /** Số HĐMB / mã hợp đồng của khách. */
  contractCodes: string[];
  /** Mã căn của khách. */
  unitCodes: string[];
  /** SĐT của khách. */
  phones: string[];
}

const digits = (s: string | null | undefined) => String(s ?? '').replace(/\D/g, '');
const code = (s: string | null | undefined) => fold(s).replace(/\s/g, '');

/**
 * Lịch lưu dạng chữ, không có khoá khách hàng → chỉ nhận dòng trùng **số HĐMB** của khách,
 * hoặc trùng **mã căn VÀ SĐT** (mã căn có thể trùng ở dự án khác nên không đủ một mình).
 */
export function matchSchedules<T extends ScheduleRow>(rows: T[], owned: OwnedKeys): T[] {
  const codes = new Set(owned.contractCodes.map(code).filter(Boolean));
  const units = new Set(owned.unitCodes.map(code).filter(Boolean));
  const phones = new Set(owned.phones.map(digits).filter((p) => p.length >= 9));
  return rows.filter((r) => {
    if (codes.has(code(r.so_hdmb))) return true;
    return units.has(code(r.ma_sp)) && phones.has(digits(r.dien_thoai));
  });
}

const cleanNote = (s: string | null | undefined) => {
  const t = String(s ?? '').trim();
  return t === '—' || t === '-' ? '' : t;
};

export function toSchedule(r: ScheduleRow): HandoverSchedule {
  return {
    id: r.id,
    contractCode: String(r.so_hdmb ?? '').trim(),
    unitCode: String(r.ma_sp ?? '').trim(),
    projectName: String(r.du_an ?? '').trim(),
    date: vnDate(r.ngay_ban_giao),
    timeSlot: String(r.khung_gio ?? '').trim(),
    method: String(r.hinh_thuc ?? '').trim(),
    staff: String(r.nhan_vien ?? '').trim(),
    status: scheduleStatusFromText(r.trang_thai),
    statusLabel: String(r.trang_thai ?? '').trim(),
    note: cleanNote(r.ghi_chu),
  };
}

/** Sắp tới = từ hôm nay trở đi và chưa bàn giao (gần nhất trước); còn lại là đã qua (mới nhất trước). */
export function splitSchedules(items: HandoverSchedule[], today: string): { upcoming: HandoverSchedule[]; past: HandoverSchedule[] } {
  const upcoming = items.filter((s) => s.date >= today && s.status !== 'done').sort((a, b) => a.date.localeCompare(b.date));
  const past = items.filter((s) => !(s.date >= today && s.status !== 'done')).sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
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

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

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
