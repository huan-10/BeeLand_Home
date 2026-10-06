/**
 * Logic thuần Nhà ở xã hội — nhãn trạng thái, các bước hồ sơ, giấy tờ, thời gian bốc thăm, kiểm tệp, liên kết.
 * Chỉ `import type` (test `tests/noxh.test.cjs` transpile file này, không phân giải alias `@/`).
 * Nhãn cho khách lấy đúng bảng "Nhãn cho khách" của `beeland/docs-claude/07-workflows/nha-o-xa-hoi.md`.
 */
import type { Tone } from '@/theme';
import type { AppNotification, NotificationType } from '@/types/notification';
import type {
  NoxhApplicationDetail,
  NoxhApplicationRow,
  NoxhCustomerSnapshot,
  NoxhDoc,
  NoxhDocStatus,
  NoxhFormat,
  NoxhLotteryItem,
  NoxhNotification,
  NoxhNotificationType,
  NoxhPublishedRow,
  NoxhQuyen,
  NoxhRound,
  NoxhRoundStatus,
  NoxhSource,
  NoxhStatus,
} from '@/types/noxh';

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const noxhStatusMeta: Record<NoxhStatus, StatusMeta> = {
  NHAP: { label: 'Chưa nộp', tone: 'neutral' },
  MOI_TIEP_NHAN: { label: 'Đã nộp hồ sơ', tone: 'success' },
  DANG_THAM_DINH: { label: 'Đang kiểm tra', tone: 'primary' },
  CAN_BO_SUNG: { label: 'Cần bổ sung', tone: 'warning' },
  DU_DIEU_KIEN: { label: 'Đã xác minh', tone: 'success' },
  DA_GUI_SXD: { label: 'Đang chờ Sở Xây dựng', tone: 'primary' },
  SXD_CHAP_THUAN: { label: 'Đủ điều kiện tham gia bốc thăm', tone: 'success' },
  KHONG_DAT: { label: 'Không đạt', tone: 'danger' },
  RUT_HO_SO: { label: 'Đã rút hồ sơ', tone: 'neutral' },
};

export const docStatusMeta: Record<NoxhDocStatus, StatusMeta> = {
  CHUA_CUNG_CAP: { label: 'Chưa nộp', tone: 'neutral' },
  CHO_THAM_DINH: { label: 'Đã nộp', tone: 'primary' },
  DAT: { label: 'Hợp lệ', tone: 'success' },
  CHUA_DAT: { label: 'Chưa đạt yêu cầu', tone: 'danger' },
};

export const roundStatusMeta: Record<NoxhRoundStatus, StatusMeta> = {
  DANG_MO: { label: 'Đang mở', tone: 'success' },
  SAP_MO: { label: 'Sắp mở', tone: 'primary' },
  DA_DONG: { label: 'Đã đóng', tone: 'neutral' },
  CHUA_CONG_BO: { label: 'Chưa công bố', tone: 'neutral' },
};

export const lotteryPhaseMeta: Record<LotteryPhase, StatusMeta> = {
  upcoming: { label: 'Sắp diễn ra', tone: 'primary' },
  open: { label: 'Đang mở', tone: 'success' },
  ended: { label: 'Đã hết giờ, chờ công bố', tone: 'warning' },
  spun: { label: 'Đã bốc thăm', tone: 'success' },
  published: { label: 'Đã công bố', tone: 'neutral' },
};

export type StepState = 'done' | 'current' | 'todo';

/* ---------------- Giấy tờ ---------------- */

const hasFile = (d: NoxhDoc) => !!d.tep_ten;

/** Giấy tờ bắt buộc chưa có tệp — còn thiếu thì không nộp được. */
export function missingRequiredDocs(docs: NoxhDoc[]): NoxhDoc[] {
  return docs.filter((d) => d.bat_buoc && !hasFile(d));
}

/** Giấy tờ khách cần bổ sung: bị chấm chưa đạt, hoặc bắt buộc mà chưa nộp. */
export function docsNeedingSupplement(docs: NoxhDoc[]): NoxhDoc[] {
  return docs.filter((d) => d.trang_thai === 'CHUA_DAT' || (d.bat_buoc && d.trang_thai === 'CHUA_CUNG_CAP'));
}

/** Tiến độ nộp trên giấy tờ bắt buộc. */
export function docProgress(docs: NoxhDoc[]): { submitted: number; required: number } {
  const required = docs.filter((d) => d.bat_buoc);
  return { submitted: required.filter(hasFile).length, required: required.length };
}

/** Dung lượng tệp: `801 KB`, `2,5 MB`. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(Math.round((kb / 1024) * 10) / 10).toString().replace('.', ',')} MB`;
}

/** Quá hạn = hạn nộp (ngày VN) đã qua và giấy tờ chưa hợp lệ. */
export function isDocOverdue(d: Pick<NoxhDoc, 'han_nop' | 'trang_thai'>, now: number): boolean {
  if (!d.han_nop || d.trang_thai === 'DAT') return false;
  const todayVN = new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return d.han_nop.slice(0, 10) < todayVN;
}

/** Hạn nộp gần nhất trong các giấy tờ cần bổ sung. */
export function nearestDueDate(docs: NoxhDoc[]): string | null {
  const dates = docsNeedingSupplement(docs)
    .map((d) => d.han_nop?.slice(0, 10))
    .filter((x): x is string => !!x)
    .sort();
  return dates[0] ?? null;
}

/* ---------------- Thông tin cá nhân ---------------- */

const blank = (v: string | null | undefined) => !v || !v.trim();

/** Nhãn các ô bắt buộc còn trống (giống `personalInfoMissing` của portal web). */
export function personalInfoMissing(s: NoxhCustomerSnapshot, loaiCanId: string | null | undefined): string[] {
  const out: string[] = [];
  if (blank(s.ten_kh)) out.push('Họ tên');
  if (blank(s.ngay_sinh)) out.push('Ngày sinh');
  if (blank(s.gioi_tinh)) out.push('Giới tính');
  if (blank(s.di_dong)) out.push('Số điện thoại');
  if (blank(s.thuong_tru?.dia_chi)) out.push('Địa chỉ thường trú');
  if (blank(s.thuong_tru?.ma_tinh)) out.push('Tỉnh/Thành phố');
  if (blank(s.thuong_tru?.ma_xa)) out.push('Phường/Xã');
  if (blank(loaiCanId)) out.push('Loại căn hộ');
  return out;
}

/* ---------------- Các bước hồ sơ ---------------- */

const VERIFIED: NoxhStatus[] = ['DU_DIEU_KIEN', 'DA_GUI_SXD', 'SXD_CHAP_THUAN'];
const VERIFYING: NoxhStatus[] = ['MOI_TIEP_NHAN', 'DANG_THAM_DINH', 'CAN_BO_SUNG'];

export interface ApplicationStep {
  key: 'thong_tin' | 'giay_to' | 'xac_minh' | 'du_dieu_kien';
  label: string;
  state: StepState;
}

/** 4 bước của màn "Hồ sơ của tôi": Thông tin cá nhân · Thành phần hồ sơ · Xác minh · Đủ điều kiện. */
export function applicationSteps(d: NoxhApplicationDetail): ApplicationStep[] {
  const infoDone = personalInfoMissing(d.kh_snapshot, d.loai_can_id).length === 0;
  const docsDone = missingRequiredDocs(d.giay_to).length === 0 && !d.giay_to.some((x) => x.trang_thai === 'CHUA_DAT');
  const s = d.trang_thai;
  return [
    { key: 'thong_tin', label: 'Thông tin cá nhân', state: infoDone ? 'done' : 'current' },
    { key: 'giay_to', label: 'Thành phần hồ sơ', state: docsDone ? 'done' : infoDone ? 'current' : 'todo' },
    { key: 'xac_minh', label: 'Xác minh', state: VERIFIED.includes(s) ? 'done' : VERIFYING.includes(s) ? 'current' : 'todo' },
    {
      key: 'du_dieu_kien',
      label: 'Đủ điều kiện',
      state: s === 'SXD_CHAP_THUAN' ? 'done' : s === 'DU_DIEU_KIEN' || s === 'DA_GUI_SXD' ? 'current' : 'todo',
    },
  ];
}

/** Lý do của lần đổi trạng thái mới nhất (Cần bổ sung / Không đạt / Rút hồ sơ). */
export function latestReason(d: Pick<NoxhApplicationDetail, 'lich_su'>): string | null {
  const latest = [...d.lich_su].sort((a, b) => b.thoi_diem.localeCompare(a.thoi_diem))[0];
  return latest?.ly_do ?? null;
}

/** Hồ sơ còn hiệu lực (luật 1 người 1 hồ sơ mỗi dự án). */
export function isActiveApplication(s: NoxhStatus): boolean {
  return s !== 'NHAP' && s !== 'KHONG_DAT' && s !== 'RUT_HO_SO';
}

export type ApplicationFilter = 'all' | 'processing' | 'supplement' | 'done';

const DONE: NoxhStatus[] = ['SXD_CHAP_THUAN', 'KHONG_DAT', 'RUT_HO_SO'];

export function applicationFilter(row: Pick<NoxhApplicationRow, 'trang_thai'>, f: ApplicationFilter): boolean {
  switch (f) {
    case 'supplement':
      return row.trang_thai === 'CAN_BO_SUNG';
    case 'done':
      return DONE.includes(row.trang_thai);
    case 'processing':
      return !DONE.includes(row.trang_thai) && row.trang_thai !== 'CAN_BO_SUNG';
    default:
      return true;
  }
}

/* ---------------- Quyền của khách ---------------- */

const NO_RIGHTS: NoxhQuyen = { sua_thong_tin: false, sua_giay_to: [], nop: false, gui_bo_sung: false, xoa: false };

/**
 * Quyền của khách theo trạng thái (bảng "Quyền của khách theo trạng thái" ở tài liệu web). Máy chủ trả `quyen`;
 * hàm này dùng cho dữ liệu mock để giao diện gặp đúng các luật sẽ gặp khi chạy thật.
 * `supplementSince`: thời điểm hồ sơ chuyển sang Cần bổ sung — tệp khách tải sau mốc này vẫn thay được (R9).
 */
export function applicationQuyen(
  trangThai: NoxhStatus,
  nguon: NoxhSource,
  docs: NoxhDoc[],
  roundOpen: boolean,
  supplementSince: string | null,
): NoxhQuyen {
  if (trangThai === 'NHAP') {
    if (nguon !== 'PORTAL') return NO_RIGHTS;
    return { sua_thong_tin: true, sua_giay_to: docs.map((d) => d.id), nop: roundOpen, gui_bo_sung: false, xoa: true };
  }
  if (trangThai === 'CAN_BO_SUNG') {
    const since = supplementSince ? Date.parse(supplementSince) : Number.POSITIVE_INFINITY;
    const editable = docs.filter(
      (d) =>
        d.trang_thai === 'CHUA_DAT' ||
        d.trang_thai === 'CHUA_CUNG_CAP' ||
        (d.trang_thai === 'CHO_THAM_DINH' && !!d.ngay_nop && Date.parse(d.ngay_nop) >= since),
    );
    return { ...NO_RIGHTS, sua_giay_to: editable.map((d) => d.id), gui_bo_sung: true };
  }
  return NO_RIGHTS;
}

/* ---------------- Thời gian (giờ Việt Nam, giờ máy chủ) ---------------- */

const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** `HH:mm dd/MM/yyyy` theo giờ Việt Nam (không phụ thuộc múi giờ máy). */
export function formatVnDateTime(iso: string): string {
  const d = new Date(Date.parse(iso) + VN_OFFSET_MS);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** Tình trạng đợt nhận hồ sơ — tính, không lưu (giống `roundStatus` của web). */
export function roundStatus(r: Pick<NoxhRound, 'tu_ngay' | 'den_ngay'> & { cong_bo?: boolean }, now: number): NoxhRoundStatus {
  if (r.cong_bo === false) return 'CHUA_CONG_BO';
  if (now < Date.parse(r.tu_ngay)) return 'SAP_MO';
  if (now > Date.parse(r.den_ngay)) return 'DA_DONG';
  return 'DANG_MO';
}

/** Số ngày còn tới hạn nhận hồ sơ (làm tròn lên, không âm). */
export function roundDaysLeft(r: Pick<NoxhRound, 'den_ngay'>, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(r.den_ngay) - now) / DAY_MS));
}

export type LotteryPhase = 'upcoming' | 'open' | 'ended' | 'spun' | 'published';

/**
 * Giai đoạn một lượt bốc thăm theo **giờ máy chủ**. Trong khung giờ luôn là `open` kể cả khi đợt còn `DA_KHOA`
 * (máy chủ quyết định, lỗi "Chưa đến giờ bốc thăm" xử lý ở nút quay).
 */
export function lotteryPhase(
  item: Pick<NoxhLotteryItem, 'tu_ngay' | 'den_ngay' | 'trang_thai' | 'da_quay'>,
  serverNow: number,
): LotteryPhase {
  if (item.trang_thai === 'DA_CONG_BO') return 'published';
  if (item.da_quay) return 'spun';
  if (serverNow < Date.parse(item.tu_ngay)) return 'upcoming';
  if (serverNow < Date.parse(item.den_ngay)) return 'open';
  return 'ended';
}

/** Số ms (giờ máy chủ) tới mốc đổi giai đoạn kế tiếp: giờ mở khi sắp diễn ra, giờ đóng khi đang mở; còn lại `null`. */
export function nextBoundaryMs(item: Pick<NoxhLotteryItem, 'tu_ngay' | 'den_ngay' | 'trang_thai' | 'da_quay'>, serverNow: number): number | null {
  const phase = lotteryPhase(item, serverNow);
  if (phase === 'upcoming') return Date.parse(item.tu_ngay) - serverNow;
  if (phase === 'open') return Date.parse(item.den_ngay) - serverNow;
  return null;
}

/** Nút "Bốc thăm" chỉ bật khi lượt đang mở, khách đã đồng ý quy định và chưa có lượt quay đang chạy. */
export function spinGuard(phase: LotteryPhase, agreed: boolean, spinning: boolean): boolean {
  return phase === 'open' && agreed && !spinning;
}

/** Độ lệch = giờ máy chủ − giờ máy (cộng vào `Date.now()` để có giờ máy chủ). */
export function serverClockOffset(serverNowIso: string, clientNow: number): number {
  const server = Date.parse(serverNowIso);
  return Number.isNaN(server) ? 0 : server - clientNow;
}

/** Đếm ngược: `2 ngày 03:04:05` hoặc `03:04:05`. */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hms = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return days > 0 ? `${days} ngày ${hms}` : hms;
}

/* ---------------- Quá trình xử lý (timeline 5 chặng) ---------------- */

export interface ProcessStep {
  key: 'nop' | 'kiem_tra' | 'xac_minh' | 'sxd' | 'boc_tham';
  label: string;
  detail: string | null;
  state: StepState;
}

function lotteryStepDetail(d: NoxhApplicationDetail, serverNow: number): { detail: string; state: StepState } {
  const bt = d.boc_tham;
  if (!bt) {
    return d.trang_thai === 'SXD_CHAP_THUAN' ? { detail: 'Chờ lịch bốc thăm', state: 'current' } : { detail: 'Chưa cập nhật', state: 'todo' };
  }
  if (bt.da_quay) {
    const detail =
      bt.ket_qua === 'TRUNG'
        ? `Trúng căn ${bt.can?.ky_hieu ?? ''}`.trim()
        : `Chưa trúng · dự phòng số ${bt.thu_tu_du_phong ?? '—'}`;
    return { detail, state: 'done' };
  }
  const phase = lotteryPhase(bt, serverNow);
  if (phase === 'upcoming') return { detail: `Lịch bốc thăm: ${formatVnDateTime(bt.tu_ngay)}`, state: 'current' };
  if (phase === 'open') return { detail: 'Đang mở — vào bốc thăm ngay', state: 'current' };
  return { detail: 'Đã hết giờ, chờ công bố', state: 'current' };
}

/** Timeline "Quá trình xử lý": Nộp · Kiểm tra · Xác minh · Sở XD · Bốc thăm. */
export function processTimeline(d: NoxhApplicationDetail, serverNow: number): ProcessStep[] {
  const s = d.trang_thai;
  const submitted = s !== 'NHAP';
  const verified = VERIFIED.includes(s);
  const approved = s === 'SXD_CHAP_THUAN';
  const lottery = lotteryStepDetail(d, serverNow);
  return [
    { key: 'nop', label: 'Nộp hồ sơ', detail: submitted ? null : 'Chưa nộp', state: submitted ? 'done' : 'current' },
    {
      key: 'kiem_tra',
      label: 'Chủ đầu tư kiểm tra',
      detail: s === 'CAN_BO_SUNG' ? 'Cần bổ sung giấy tờ' : s === 'KHONG_DAT' ? 'Không đạt' : s === 'RUT_HO_SO' ? 'Đã rút hồ sơ' : null,
      state: verified ? 'done' : VERIFYING.includes(s) ? 'current' : 'todo',
    },
    { key: 'xac_minh', label: 'Xác minh đủ điều kiện', detail: null, state: verified ? 'done' : 'todo' },
    {
      key: 'sxd',
      label: 'Sở Xây dựng chấp thuận',
      detail: null,
      state: approved ? 'done' : s === 'DU_DIEU_KIEN' || s === 'DA_GUI_SXD' ? 'current' : 'todo',
    },
    { key: 'boc_tham', label: 'Tham gia bốc thăm', detail: lottery.detail, state: approved || d.boc_tham ? lottery.state : 'todo' },
  ];
}

/* ---------------- Chặng hiện tại (thẻ trạng thái) ---------------- */

const STAGES = ['Nộp hồ sơ', 'Chủ đầu tư kiểm tra', 'Xác minh đủ điều kiện', 'Sở Xây dựng chấp thuận', 'Tham gia bốc thăm'];
const STAGE_DONE: Partial<Record<NoxhStatus, number>> = {
  NHAP: 0,
  MOI_TIEP_NHAN: 1,
  DANG_THAM_DINH: 1,
  CAN_BO_SUNG: 1,
  DU_DIEU_KIEN: 3,
  DA_GUI_SXD: 3,
  SXD_CHAP_THUAN: 4,
};

/** Số chặng đã xong + chặng đang ở (5 chặng); hồ sơ kết thúc không đạt / đã rút → `null`. */
export function stageProgress(s: NoxhStatus, lotteryDone: boolean): { done: number; current: string; step: number; total: number } | null {
  const base = STAGE_DONE[s];
  if (base === undefined) return null;
  const done = s === 'SXD_CHAP_THUAN' && lotteryDone ? 5 : base;
  return { done, current: done >= 5 ? 'Hoàn tất bốc thăm' : STAGES[done], step: Math.min(done + 1, 5), total: 5 };
}

/* ---------------- Hồ sơ nổi bật & việc cần làm ---------------- */

const FEATURE_RANK: Partial<Record<NoxhStatus, number>> = { CAN_BO_SUNG: 0, NHAP: 1, SXD_CHAP_THUAN: 2 };
const featureRank = (s: NoxhStatus) => FEATURE_RANK[s] ?? (s === 'KHONG_DAT' || s === 'RUT_HO_SO' ? 4 : 3);

/** Hồ sơ cần chú ý nhất cho thẻ chính của trang NOXH. */
export function pickFeaturedApplication(rows: NoxhApplicationRow[]): NoxhApplicationRow | null {
  const sorted = [...rows].sort((a, b) => featureRank(a.trang_thai) - featureRank(b.trang_thai) || b.updated_at.localeCompare(a.updated_at));
  return sorted[0] ?? null;
}

export type NoxhAttention = { kind: 'supplement' | 'lottery_open' | 'lottery_soon'; title: string; href: string } | null;

/** Việc NOXH cần khách làm ngay (thẻ nhắc ở Trang chủ / Trang NOXH). */
export function noxhAttention(rows: NoxhApplicationRow[], lotteries: NoxhLotteryItem[], serverNow: number): NoxhAttention {
  const open = lotteries.find((l) => lotteryPhase(l, serverNow) === 'open');
  if (open) return { kind: 'lottery_open', title: `Đang mở bốc thăm: ${open.ten}`, href: `/noxh/boc-tham/${open.bt_ho_so_id}` };
  const soon = lotteries.find((l) => lotteryPhase(l, serverNow) === 'upcoming' && Date.parse(l.tu_ngay) - serverNow <= DAY_MS);
  if (soon) return { kind: 'lottery_soon', title: `Bốc thăm lúc ${formatVnDateTime(soon.tu_ngay)}`, href: `/noxh/boc-tham/${soon.bt_ho_so_id}` };
  const sup = rows.find((r) => r.trang_thai === 'CAN_BO_SUNG');
  if (sup) return { kind: 'supplement', title: `Hồ sơ ${sup.so_ho_so} cần bổ sung giấy tờ`, href: `/noxh/ho-so/${sup.id}` };
  return null;
}

/** Lượt bốc thăm nổi bật trên trang NOXH: đang mở chưa quay, sau đó lượt sắp diễn ra gần nhất. */
export function pickLotteryHighlight(items: NoxhLotteryItem[], serverNow: number): NoxhLotteryItem | null {
  const open = items.find((l) => lotteryPhase(l, serverNow) === 'open');
  if (open) return open;
  const upcoming = items.filter((l) => lotteryPhase(l, serverNow) === 'upcoming').sort((a, b) => a.tu_ngay.localeCompare(b.tu_ngay));
  return upcoming[0] ?? null;
}

/** Dòng việc cần làm dưới thanh chặng của thẻ trạng thái. */
export function applicationNote(row: Pick<NoxhApplicationRow, 'trang_thai' | 'so_can_bo_sung' | 'so_da_nop' | 'so_giay_to'>): string | null {
  if (row.trang_thai === 'CAN_BO_SUNG') return `Cần bổ sung ${row.so_can_bo_sung} giấy tờ`;
  if (row.trang_thai === 'NHAP') return `Hồ sơ chưa nộp · đã tải ${row.so_da_nop}/${row.so_giay_to} giấy tờ`;
  return null;
}

/** Đợt hiển thị ở mục "Đợt đang nhận hồ sơ": Đang mở và Sắp mở. */
export function upcomingRounds<T extends Pick<NoxhRound, 'tinh_trang'>>(rounds: T[]): T[] {
  return rounds.filter((r) => r.tinh_trang === 'DANG_MO' || r.tinh_trang === 'SAP_MO');
}

/* ---------------- Kiểm tệp ---------------- */

export const NOXH_MIME: Record<NoxhFormat, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  png: 'image/png',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export type FileCheck = { ok: true; ext: NoxhFormat } | { ok: false; message: string };

const HEIC_MESSAGE =
  'Ảnh HEIC chưa được hỗ trợ. Hãy chọn ảnh JPG/PNG (iPhone: Cài đặt › Camera › Định dạng › Tương thích nhất).';

function fileExt(name: string): string {
  const i = name.lastIndexOf('.');
  if (i <= 0 || i === name.length - 1) return '';
  const ext = name.slice(i + 1).toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}

/** Kiểm tệp trước khi tải (đuôi theo định dạng của giấy tờ, MIME khớp đuôi, dung lượng, chặn HEIC). */
export function validateNoxhFile(file: { name: string; size: number; type?: string | null }, formats: NoxhFormat[], maxMb: number): FileCheck {
  const ext = fileExt(file.name);
  const type = (file.type ?? '').toLowerCase();
  if (ext === 'heic' || ext === 'heif' || type === 'image/heic' || type === 'image/heif') return { ok: false, message: HEIC_MESSAGE };
  const format = formats.find((f) => f === ext);
  const formatMessage = `Chỉ nhận tệp ${formats.map((f) => f.toUpperCase()).join(', ')}`;
  if (!format) return { ok: false, message: formatMessage };
  if (type && type !== NOXH_MIME[format]) return { ok: false, message: formatMessage };
  if (file.size > maxMb * 1024 * 1024) return { ok: false, message: `Tệp vượt quá ${maxMb} MB` };
  return { ok: true, ext: format };
}

const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };

/**
 * Tên tệp sau khi chọn: ảnh đã được chuyển JPEG/PNG nhưng tên còn đuôi khác (iPhone `IMG_0001.HEIC`) → đổi đuôi theo MIME,
 * để bước kiểm tệp không chặn nhầm. Đuôi đã khớp (kể cả `.jpeg`) giữ nguyên.
 */
export function normalizePickedName(name: string, mime: string | null | undefined): string {
  const want = mime ? MIME_EXT[mime.toLowerCase()] : undefined;
  if (!want) return name;
  const ext = fileExt(name);
  if (ext === want) return name;
  const i = name.lastIndexOf('.');
  return `${i > 0 ? name.slice(0, i) : name}.${want}`;
}

/** Gợi ý dưới tên giấy tờ: `PDF, JPG, PNG · tối đa 5 MB`. */
export function formatFileHint(formats: NoxhFormat[], maxMb: number): string {
  return `${formats.map((f) => f.toUpperCase()).join(', ')} · tối đa ${maxMb} MB`;
}

/* ---------------- Liên kết, CCCD, phiên ---------------- */

const ID = '[A-Za-z0-9-]+';
const LINKS: [RegExp, (id?: string) => string][] = [
  [new RegExp(`^boc-tham/(${ID})$`), (id) => `/noxh/boc-tham/${id}`],
  [/^boc-tham$/, () => '/noxh/boc-tham'],
  [new RegExp(`^ho-so/(${ID})$`), (id) => `/noxh/ho-so/${id}`],
];

/** Link thông báo của portal (`boc-tham/<id>`, `ho-so/<id>`) → route trong app; link lạ → `/noxh`. */
export function noxhLinkToHref(link: string | null | undefined): string {
  const l = (link ?? '').trim().replace(/^\//, '');
  for (const [re, to] of LINKS) {
    const match = re.exec(l);
    if (match) return to(match[1]);
  }
  return '/noxh';
}

export function normalizeCccd(v: string): string {
  return v.replace(/\D/g, '');
}

export function isValidCccd(v: string): boolean {
  return /^\d{12}$/.test(normalizeCccd(v));
}

export const SESSION_EXPIRED = 'PHIEN_HET_HAN';

/** Máy chủ từ chối lưu / nộp vì tài khoản chưa có CCCD → app mời khách cập nhật CCCD. */
export function isMissingCccdError(message: string): boolean {
  return message.startsWith('Tài khoản chưa có CCCD');
}

/** Lỗi phiên NOXH hết hạn — phong bì `{ error: 'PHIEN_HET_HAN' }` của RPC hoặc `Error` cùng thông điệp. */
export function isNoxhSessionExpired(error: unknown): boolean {
  if (error instanceof Error) return error.message === SESSION_EXPIRED;
  return typeof error === 'object' && error !== null && 'error' in error && error.error === SESSION_EXPIRED;
}

/* ---------------- Kết quả công bố ---------------- */

const compact = (v: string) => v.replace(/\s+/g, '').toLowerCase();

/** Tra kết quả theo số hồ sơ (khớp một phần, bỏ khoảng trắng, không phân biệt hoa thường). */
export function filterPublishedRows(rows: NoxhPublishedRow[], query: string): NoxhPublishedRow[] {
  const q = compact(query);
  return q ? rows.filter((r) => compact(r.so_ho_so).includes(q)) : rows;
}

export const PAGE_SIZE = 20;

/** Phân trang; trang ngoài khoảng → kẹp về trang hợp lệ gần nhất. */
export function paginate<T>(rows: T[], page: number, size = PAGE_SIZE): { items: T[]; pages: number; page: number } {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { items: rows.slice((current - 1) * size, current * size), pages, page: current };
}

/* ---------------- Thông báo ---------------- */

const NOTI_TYPE: Record<NoxhNotificationType, NotificationType> = {
  LICH_BOC_THAM: 'noxh_lottery',
  KET_QUA_BOC_THAM: 'noxh_result',
  HUY_BOC_THAM: 'noxh_cancel',
};
const NOXH_PREFIX = 'noxh:';

/** Thông báo NOXH → thông báo chung của app (id tiền tố `noxh:`, link đổi sang route trong app). */
export function noxhToAppNotification(n: NoxhNotification): AppNotification {
  return {
    id: `${NOXH_PREFIX}${n.id}`,
    type: NOTI_TYPE[n.loai] ?? 'noxh_lottery',
    title: n.tieu_de,
    message: n.noi_dung ?? '',
    createdAt: n.created_at,
    read: !!n.da_doc_luc,
    link: noxhLinkToHref(n.link),
  };
}

/** Id gốc của thông báo NOXH (null nếu không phải thông báo NOXH). */
export function noxhNotificationId(appId: string): string | null {
  return appId.startsWith(NOXH_PREFIX) ? appId.slice(NOXH_PREFIX.length) : null;
}
