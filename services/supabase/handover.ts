import { matchSchedules, ownedHandovers, scheduleProgress, toSchedule, type FundRow, type OwnedContract, type ScheduleRow } from '@/lib/handover';
import type { Handover, HandoverSchedule } from '@/types';

import { rpc } from './client';
import { getPgcSchedule } from './customerData';
import { getContractBundles } from './customerDomain';
import { ServiceError } from '../errors';
import { requireCustomerScope, requirePortalToken } from '../session';

/**
 * Đọc THEO PHIÊN KHÁCH (2026-10-08): `fn_portal_app_ban_giao` (quỹ bàn giao của các phiếu thuộc hồ sơ đang xem + lịch + SĐT hồ sơ)
 * bằng token phiên — không đọc bảng / gọi fn_handover_fund_list bằng JWT tài khoản hệ thống nữa.
 *
 * Bàn giao căn hộ của KHÁCH ĐANG ĐĂNG NHẬP — đọc như web (Hợp đồng › Bàn giao), CHỈ ĐỌC:
 *  - Quỹ bàn giao: RPC `fn_handover_fund_list` (web `HandoverFundService.list`), tìm theo từng mã căn của khách,
 *    rồi chỉ giữ dòng có `khach_hang_id` = khách VÀ `phieu_giu_cho_id` thuộc hợp đồng của khách (`ownedHandovers`).
 *  - Lịch bàn giao: bảng `bee_handover_schedules` (web `HandoverScheduleCloud`) lọc `ma_ctdk_uid` = công ty của khách
 *    và số HĐMB / mã căn của khách; lịch lưu dạng chữ nên ghép lại phía app (`matchSchedules`: trùng số HĐMB, hoặc mã căn + SĐT).
 */

async function ownedContracts(): Promise<Map<string, OwnedContract>> {
  const bundles = await getContractBundles();
  return new Map(
    bundles.map(({ item: c }) => [c.id, { id: c.id, code: c.code, unitCode: c.unitCode, projectName: c.projectName, projectImageUrl: c.projectImageUrl }]),
  );
}

const uniq = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter(Boolean))];

/** Quỹ + lịch bàn giao + SĐT hồ sơ của phiên (`fn_portal_app_ban_giao`). */
async function loadHandoverData(): Promise<{ quy: FundRow[]; lich: ScheduleRow[]; sdt: string[] }> {
  const res = await rpc<{ data?: { quy?: FundRow[]; lich?: ScheduleRow[]; sdt?: string[] }; error?: string } | null>('fn_portal_app_ban_giao', {
    p_token: requirePortalToken(),
  });
  if (res?.error) throw new ServiceError(res.error, /hết hạn/i.test(res.error) ? 'UNAUTHORIZED' : 'UNKNOWN');
  return { quy: res?.data?.quy ?? [], lich: res?.data?.lich ?? [], sdt: (res?.data?.sdt ?? []).filter(Boolean) };
}

export async function fetchHandovers(): Promise<Handover[]> {
  const scope = requireCustomerScope();
  const contracts = await ownedContracts();
  if (contracts.size === 0) return [];
  const { quy } = await loadHandoverData();
  // Server đã lọc theo hồ sơ; ownedHandovers ghép lại theo khách + hợp đồng của khách (lọc thêm một lần ở app).
  return withRealProgress(ownedHandovers(quy, scope.customerId, contracts));
}

/**
 * Tiến độ thanh toán / phí bảo trì THẬT từ lịch thanh toán của hợp đồng (không dùng % gõ tay trên quỹ).
 * Hợp đồng chưa có lịch qua RPC → % đã trả của hợp đồng (cùng cách màn Hợp đồng tính), không tách PBT.
 */
async function withRealProgress(items: Handover[]): Promise<Handover[]> {
  const bundles = await getContractBundles();
  const paidOf = new Map(bundles.map((b) => [b.item.id, b.item.summary.paidPercent]));
  return Promise.all(
    items.map(async (h) => {
      const rows = await getPgcSchedule(h.contractId).catch(() => []);
      const p = scheduleProgress(rows);
      return p.paymentPercent !== null ? { ...h, ...p } : { ...h, paymentPercent: paidOf.get(h.contractId) ?? null, maintenancePercent: null };
    }),
  );
}

export async function fetchHandoverSchedules(): Promise<HandoverSchedule[]> {
  const scope = requireCustomerScope();
  const contracts = [...(await ownedContracts()).values()];
  const codes = uniq(contracts.map((c) => c.code));
  const units = uniq(contracts.map((c) => c.unitCode));
  if (codes.length === 0 && units.length === 0) return [];
  const { lich, sdt } = await loadHandoverData();
  // Lọc lại phía app: đúng công ty + ghép đúng khách.
  const own = lich.filter((r) => (r as ScheduleRow & { ma_ctdk_uid?: string | null }).ma_ctdk_uid === scope.companyId);
  return matchSchedules(own, { contractCodes: codes, unitCodes: units, phones: uniq(sdt) }).map(toSchedule);
}
