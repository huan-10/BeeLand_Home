import { ownedHandovers, scheduleProgress, toSchedule, type FundRow, type OwnedContract, type PortalScheduleRow } from '@/lib/handover';
import type { Handover, HandoverSchedule, HandoverSlots } from '@/types';

import { rpc } from './client';
import { getPgcSchedule } from './customerData';
import { getContractBundles } from './customerDomain';
import { ServiceError } from '../errors';
import { requireCustomerScope, requirePortalToken } from '../session';

/**
 * Bàn giao căn hộ của KHÁCH ĐANG ĐĂNG NHẬP — mọi hàm theo token phiên khách (anon), không tài khoản hệ thống:
 *  - `fn_portal_app_ban_giao`: quỹ bàn giao (`bee_handover_funds`) của các phiếu thuộc hồ sơ + lịch hẹn nhận nhà
 *    (`bg_lich_hen` qua `_bg_lich_khach`, server đã lọc đúng khách) — app ghép lại quỹ theo khách + hợp đồng (`ownedHandovers`).
 *  - Khách tự đăng ký lịch trong khoảng bàn giao (migration web `20261017100000_portal_bg_dang_ky`):
 *    `fn_portal_app_bg_ca` (ca + chỗ còn), `fn_portal_app_bg_dang_ky`, `fn_portal_app_bg_doi`, `fn_portal_app_bg_huy`.
 *    Lịch khách tạo ở `CHO_XAC_NHAN` — nhân viên xác nhận trên web (màn Lịch bàn giao, nhãn "Khách tự đăng ký").
 */

async function ownedContracts(): Promise<Map<string, OwnedContract>> {
  const bundles = await getContractBundles();
  return new Map(
    bundles.map(({ item: c }) => [c.id, { id: c.id, code: c.code, unitCode: c.unitCode, projectName: c.projectName, projectImageUrl: c.projectImageUrl }]),
  );
}

type PortalResult<T> = { data?: T; error?: string } | null;

/** `{error}` của máy chủ → ServiceError giữ nguyên thông điệp tiếng Việt; phiên hết hạn → UNAUTHORIZED. */
function unwrap<T>(res: PortalResult<T>): T | undefined {
  if (res?.error) throw new ServiceError(res.error, /hết hạn/i.test(res.error) ? 'UNAUTHORIZED' : 'UNKNOWN');
  return res?.data;
}

/** Quỹ bàn giao của khách (tiến độ thật) + mọi lịch hẹn nhận nhà còn lưu (trừ lịch đã huỷ). */
export async function fetchHandoverData(): Promise<{ handovers: Handover[]; schedules: HandoverSchedule[] }> {
  const scope = requireCustomerScope();
  const contracts = await ownedContracts();
  if (contracts.size === 0) return { handovers: [], schedules: [] };
  const data = unwrap(
    await rpc<PortalResult<{ quy?: FundRow[]; lich?: PortalScheduleRow[] }>>('fn_portal_app_ban_giao', { p_token: requirePortalToken() }),
  );
  // Server đã lọc theo hồ sơ; ownedHandovers ghép lại theo khách + hợp đồng của khách (lọc thêm một lần ở app).
  const handovers = await withRealProgress(ownedHandovers(data?.quy ?? [], scope.customerId, contracts));
  return { handovers, schedules: (data?.lich ?? []).map(toSchedule) };
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

interface SlotsRow {
  tu: string;
  den: string;
  ngay: { ngay: string; ca: { ca_id: string; ten: string | null; tu_gio: string | null; den_gio: string | null; so_khach: number; con: number }[] }[];
}

/** Ca + chỗ còn cho mọi ngày trong khoảng đăng ký của căn (hôm nay đã bỏ ca đã bắt đầu). */
export async function fetchHandoverSlots(fundId: string): Promise<HandoverSlots> {
  const data = unwrap(await rpc<PortalResult<SlotsRow>>('fn_portal_app_bg_ca', { p_token: requirePortalToken(), p_ban_giao_id: fundId }));
  if (!data) throw new ServiceError('Không tải được lịch trống, vui lòng thử lại');
  return {
    from: data.tu,
    to: data.den,
    days: (data.ngay ?? []).map((d) => ({
      date: d.ngay,
      shifts: (d.ca ?? []).map((c) => ({
        id: c.ca_id,
        name: String(c.ten ?? '').trim(),
        from: String(c.tu_gio ?? ''),
        to: String(c.den_gio ?? ''),
        capacity: Number(c.so_khach) || 0,
        remaining: Number(c.con) || 0,
      })),
    })),
  };
}

export async function submitHandoverBooking(fundId: string, date: string, shiftId: string): Promise<void> {
  unwrap(await rpc<PortalResult<{ id: string }>>('fn_portal_app_bg_dang_ky', { p_token: requirePortalToken(), p_ban_giao_id: fundId, p_ngay: date, p_ca_id: shiftId }));
}

export async function submitHandoverReschedule(scheduleId: string, date: string, shiftId: string): Promise<void> {
  unwrap(await rpc<PortalResult<{ id: string }>>('fn_portal_app_bg_doi', { p_token: requirePortalToken(), p_lich_id: scheduleId, p_ngay: date, p_ca_id: shiftId }));
}

export async function submitHandoverCancel(scheduleId: string): Promise<void> {
  unwrap(await rpc<PortalResult<{ id: string }>>('fn_portal_app_bg_huy', { p_token: requirePortalToken(), p_lich_id: scheduleId }));
}
