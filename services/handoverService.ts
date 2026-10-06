import { mockContracts } from '@/data/mock/contracts';
import { mockSeller } from '@/data/mock/contractDetails';
import { mockFunds, mockSchedules } from '@/data/mock/handover';
import { matchSchedules, ownedHandovers, sortHandovers, toSchedule, vnToday } from '@/lib/handover';
import type { Handover, HandoverScheduleList } from '@/types';

import { AUTH_BACKEND } from './config';
import { getContracts } from './contractService';
import { simulateLatency } from './mockLatency';
import { isNoxhOnlySession } from './session';
import { getSellerCompany } from './supabase/customerData';
import { fetchHandovers, fetchHandoverSchedules } from './supabase/handover';

/** yyyy-MM-dd lệch `offset` ngày so với hôm nay (giờ VN) — dữ liệu giả. */
function shiftDay(offset: number): string {
  const d = new Date(`${vnToday()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

const MOCK_CUSTOMER = 'user-001';
const MOCK_PHONE = '0901234567';

const mockOwned = () =>
  new Map(mockContracts.map((c) => [c.id, { id: c.id, code: c.code, unitCode: c.unitCode, projectName: c.projectName, projectImageUrl: c.projectImageUrl }]));

/**
 * Bàn giao căn hộ ("Quỹ bàn giao" trên web) của khách đang đăng nhập.
 * // TODO: thay bằng gọi API/database thật — bản thật đã nối ở `supabase/handover.ts` (AUTH_BACKEND = 'api').
 */
export async function getHandovers(): Promise<Handover[]> {
  if (isNoxhOnlySession()) return [];
  if (AUTH_BACKEND === 'api') return sortHandovers(await fetchHandovers());
  await simulateLatency();
  const rows = mockFunds.map(({ fromOffset, toOffset, ...r }) => ({
    ...r,
    tu_ngay: fromOffset === null ? null : shiftDay(fromOffset),
    den_ngay: toOffset === null ? null : shiftDay(toOffset),
  }));
  // Như bản thật: tiến độ lấy từ hợp đồng, không dùng % gõ tay trên quỹ.
  const paid = new Map((await getContracts()).map((c) => [c.id, c.summary.paidPercent]));
  const items = ownedHandovers(rows, MOCK_CUSTOMER, mockOwned()).map((h) => ({ ...h, paymentPercent: paid.get(h.contractId) ?? null }));
  return sortHandovers(items);
}

/** Lịch bàn giao của khách (chỉ xem) + hotline chủ đầu tư để liên hệ đổi lịch. */
export async function getHandoverSchedules(): Promise<HandoverScheduleList> {
  if (isNoxhOnlySession()) return { items: [], hotline: '' };
  if (AUTH_BACKEND === 'api') {
    const [items, seller] = await Promise.all([fetchHandoverSchedules(), getSellerCompany()]);
    return { items, hotline: seller?.dien_thoai ?? '' };
  }
  await simulateLatency();
  const owned = [...mockOwned().values()];
  const rows = mockSchedules.map(({ dayOffset, ...r }) => ({ ...r, ngay_ban_giao: shiftDay(dayOffset) }));
  const items = matchSchedules(rows, { contractCodes: owned.map((c) => c.code), unitCodes: owned.map((c) => c.unitCode), phones: [MOCK_PHONE] }).map(toSchedule);
  return { items, hotline: mockSeller.hotline };
}
