import { mockContracts } from '@/data/mock/contracts';
import { mockSeller } from '@/data/mock/contractDetails';
import { mockFunds, mockSchedules, mockShifts } from '@/data/mock/handover';
import { appointmentState, ownedHandovers, sortOverview, toSchedule, vnToday, type PortalScheduleRow } from '@/lib/handover';
import type { Handover, HandoverOverview, HandoverSchedule, HandoverSlots } from '@/types';

import { AUTH_BACKEND } from './config';
import { getContracts } from './contractService';
import { ServiceError } from './errors';
import { simulateLatency } from './mockLatency';
import { isNoxhOnlySession } from './session';
import { getSellerCompany } from './supabase/customerData';
import {
  fetchHandoverData,
  fetchHandoverSlots,
  submitHandoverBooking,
  submitHandoverCancel,
  submitHandoverReschedule,
} from './supabase/handover';

/** yyyy-MM-dd lệch `offset` ngày so với `from` (mặc định hôm nay giờ VN). */
function shiftDay(offset: number, from: string = vnToday()): string {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

const MOCK_CUSTOMER = 'user-001';

const mockOwned = () =>
  new Map(mockContracts.map((c) => [c.id, { id: c.id, code: c.code, unitCode: c.unitCode, projectName: c.projectName, projectImageUrl: c.projectImageUrl }]));

/** Ghép lịch theo căn → khối "Lịch nhận nhà"; căn đang chờ chọn lịch lên đầu. */
function buildOverview(handovers: Handover[], schedules: HandoverSchedule[], hotline: string): HandoverOverview {
  const today = vnToday();
  const items = handovers.map((h) => ({ ...h, appointment: appointmentState(h, schedules.filter((s) => s.fundId === h.id), today) }));
  return { items: sortOverview(items), hotline };
}

/* ---------------- Bản giả: lịch sửa trong bộ nhớ ---------------- */

let mockRows: PortalScheduleRow[] | null = null;
let mockSeq = 0;

function mockLich(): PortalScheduleRow[] {
  // Biên bản giả ký đúng ngày hẹn.
  mockRows ??= mockSchedules.map(({ dayOffset, ...r }) => {
    const ngay = shiftDay(dayOffset);
    return { ...r, ngay, bien_ban: r.bien_ban && { ...r.bien_ban, ngay_ban_giao: r.bien_ban.ngay_ban_giao ?? ngay } };
  });
  return mockRows;
}

function mockFundRows() {
  return mockFunds.map(({ fromOffset, toOffset, ...r }) => ({
    ...r,
    tu_ngay: fromOffset === null ? null : shiftDay(fromOffset),
    den_ngay: toOffset === null ? null : shiftDay(toOffset),
  }));
}

const LIVE = ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_BAN_GIAO'];

function mockShiftRow(shiftId: string) {
  const s = mockShifts.find((x) => x.id === shiftId);
  if (!s) throw new ServiceError('Ca nhận nhà không tồn tại');
  return { ca_id: s.id, ca: `${s.from}–${s.to}`, tu_gio: s.from, den_gio: s.to };
}

function mockOwnSchedule(scheduleId: string): PortalScheduleRow {
  const r = mockLich().find((x) => x.id === scheduleId);
  if (!r) throw new ServiceError('Không tìm thấy lịch nhận nhà', 'NOT_FOUND');
  if (!r.khach_dang_ky) throw new ServiceError('Lịch do chủ đầu tư sắp xếp — vui lòng liên hệ để thay đổi');
  if (r.trang_thai !== 'CHO_XAC_NHAN') throw new ServiceError('Lịch đã được xác nhận — vui lòng liên hệ để thay đổi');
  return r;
}

/* ---------------- API cho màn hình ---------------- */

/**
 * Bàn giao căn hộ ("Quỹ bàn giao" trên web) của khách + lịch nhận nhà của từng căn + hotline chủ đầu tư.
 * // TODO: thay bằng gọi API/database thật — bản thật đã nối ở `supabase/handover.ts` (AUTH_BACKEND = 'api').
 */
export async function getHandoverOverview(): Promise<HandoverOverview> {
  if (isNoxhOnlySession()) return { items: [], hotline: '' };
  if (AUTH_BACKEND === 'api') {
    const [{ handovers, schedules }, seller] = await Promise.all([fetchHandoverData(), getSellerCompany()]);
    return buildOverview(handovers, schedules, seller?.dien_thoai ?? '');
  }
  await simulateLatency();
  // Như bản thật: tiến độ lấy từ hợp đồng, không dùng % gõ tay trên quỹ.
  const paid = new Map((await getContracts()).map((c) => [c.id, c.summary.paidPercent]));
  const handovers = ownedHandovers(mockFundRows(), MOCK_CUSTOMER, mockOwned()).map((h) => ({ ...h, paymentPercent: paid.get(h.contractId) ?? null }));
  return buildOverview(handovers, mockLich().map(toSchedule), mockSeller.hotline);
}

/**
 * Ca + chỗ còn từng ngày trong khoảng đăng ký của căn.
 * // TODO: thay bằng gọi API/database thật — bản thật: `fn_portal_app_bg_ca`.
 */
export async function getHandoverSlots(fundId: string): Promise<HandoverSlots> {
  if (AUTH_BACKEND === 'api') return fetchHandoverSlots(fundId);
  await simulateLatency();
  const f = mockFundRows().find((x) => x.id === fundId);
  if (!f?.tu_ngay || !f.den_ngay) throw new ServiceError('Chưa có thời gian bàn giao');
  const today = vnToday();
  const from = f.tu_ngay > today ? f.tu_ngay : today;
  const days: HandoverSlots['days'] = [];
  for (let i = 0; i < 10; i++) {
    const date = shiftDay(i, from);
    if (date > f.den_ngay) break;
    days.push({
      date,
      shifts: mockShifts.map((s, j) => {
        const booked = mockLich().filter((r) => r.ngay === date && r.ca_id === s.id && LIVE.includes(String(r.trang_thai))).length;
        // Ngày thứ 3 kín hết để thấy trạng thái "Kín"; các ngày khác còn chỗ lệch nhau.
        const taken = i === 2 ? s.capacity : (i + j) % s.capacity;
        return { ...s, remaining: Math.max(0, s.capacity - taken - booked) };
      }),
    });
  }
  return { from, to: f.den_ngay, days };
}

/**
 * Khách đăng ký lịch nhận nhà (chờ chủ đầu tư xác nhận).
 * // TODO: thay bằng gọi API/database thật — bản thật: `fn_portal_app_bg_dang_ky`.
 */
export async function bookHandover(fundId: string, date: string, shiftId: string): Promise<void> {
  if (AUTH_BACKEND === 'api') return submitHandoverBooking(fundId, date, shiftId);
  await simulateLatency();
  const f = mockFunds.find((x) => x.id === fundId);
  if (!f) throw new ServiceError('Không tìm thấy căn bàn giao', 'NOT_FOUND');
  if (mockLich().some((r) => r.ban_giao_id === fundId && LIVE.includes(String(r.trang_thai)))) throw new ServiceError('Quỹ đã có lịch hẹn hiệu lực', 'CONFLICT');
  mockLich().push({
    id: `lbg-mock-${++mockSeq}`,
    ban_giao_id: fundId,
    so_qbg: f.so_qbg,
    ky_hieu: f.ky_hieu,
    lan: mockLich().filter((r) => r.ban_giao_id === fundId).length + 1,
    ngay: date,
    ...mockShiftRow(shiftId),
    dia_diem: null,
    trang_thai: 'CHO_XAC_NHAN',
    trang_thai_ten: 'Chờ xác nhận',
    khach_dang_ky: true,
    nhan_vien: null,
    lien_he: mockSeller.hotline,
    so_tien_can_nop: null,
    bien_ban: null,
  });
}

/**
 * Khách đổi ngày / ca của lịch do mình đặt (còn chờ xác nhận).
 * // TODO: thay bằng gọi API/database thật — bản thật: `fn_portal_app_bg_doi`.
 */
export async function rescheduleHandover(scheduleId: string, date: string, shiftId: string): Promise<void> {
  if (AUTH_BACKEND === 'api') return submitHandoverReschedule(scheduleId, date, shiftId);
  await simulateLatency();
  Object.assign(mockOwnSchedule(scheduleId), { ngay: date, ...mockShiftRow(shiftId) });
}

/**
 * Khách huỷ lịch do mình đặt (còn chờ xác nhận) — căn quay lại trạng thái được chọn lịch.
 * // TODO: thay bằng gọi API/database thật — bản thật: `fn_portal_app_bg_huy`.
 */
export async function cancelHandover(scheduleId: string): Promise<void> {
  if (AUTH_BACKEND === 'api') return submitHandoverCancel(scheduleId);
  await simulateLatency();
  const r = mockOwnSchedule(scheduleId);
  // Lịch huỷ không trả về app (như `_bg_lich_khach` bỏ `HUY`).
  mockRows = mockLich().filter((x) => x !== r);
}
