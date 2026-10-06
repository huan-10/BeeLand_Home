import { matchSchedules, ownedHandovers, scheduleProgress, toSchedule, type FundRow, type OwnedContract, type ScheduleRow } from '@/lib/handover';
import type { Handover, HandoverSchedule } from '@/types';

import { inList, restGet, rpc, str } from './client';
import { getPgcSchedule } from './customerData';
import { getContractBundles } from './customerDomain';
import { withServiceJwt } from './portal';
import { requireCustomerScope } from '../session';

/**
 * Bàn giao căn hộ của KHÁCH ĐANG ĐĂNG NHẬP — đọc như web (Hợp đồng › Bàn giao), CHỈ ĐỌC:
 *  - Quỹ bàn giao: RPC `fn_handover_fund_list` (web `HandoverFundService.list`), tìm theo từng mã căn của khách,
 *    rồi chỉ giữ dòng có `khach_hang_id` = khách VÀ `phieu_giu_cho_id` thuộc hợp đồng của khách (`ownedHandovers`).
 *  - Lịch bàn giao: bảng `bee_handover_schedules` (web `HandoverScheduleCloud`) lọc `ma_ctdk_uid` = công ty của khách
 *    và số HĐMB / mã căn của khách; lịch lưu dạng chữ nên ghép lại phía app (`matchSchedules`: trùng số HĐMB, hoặc mã căn + SĐT).
 */

const SCHEDULE_COLUMNS = 'id,so_hdmb,ma_sp,du_an,ten_kh,dien_thoai,ngay_ban_giao,khung_gio,hinh_thuc,nhan_vien,trang_thai,ghi_chu,ma_ctdk_uid';

async function ownedContracts(): Promise<Map<string, OwnedContract>> {
  const bundles = await getContractBundles();
  return new Map(
    bundles.map(({ item: c }) => [c.id, { id: c.id, code: c.code, unitCode: c.unitCode, projectName: c.projectName, projectImageUrl: c.projectImageUrl }]),
  );
}

const uniq = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter(Boolean))];

/** SĐT trên hồ sơ khách (`di_dong` dùng cho tìm quỹ bàn giao; cả hai dùng ghép lịch). */
async function customerPhones(jwt: string, scope: { customerId: string; companyId: string }): Promise<{ diDong: string; all: string[] }> {
  const rows = await restGet<{ dien_thoai: string | null; di_dong: string | null }[]>(
    `cloud_customers?select=dien_thoai,di_dong&id=eq.${encodeURIComponent(scope.customerId)}&ma_ctdk=eq.${encodeURIComponent(scope.companyId)}&limit=1`,
    jwt,
  ).catch(() => []);
  const diDong = str(rows?.[0]?.di_dong).trim();
  return { diDong, all: uniq([str(rows?.[0]?.dien_thoai), diDong]) };
}

const fundPage = (jwt: string, search: string) =>
  rpc<{ data?: FundRow[] } | null>('fn_handover_fund_list', { p_da_project_id: null, p_input_search: search, p_state: null, p_page_index: 1, p_page_size: 100 }, jwt).then(
    (p) => (Array.isArray(p?.data) ? p.data : []),
  );

export async function fetchHandovers(): Promise<Handover[]> {
  const scope = requireCustomerScope();
  const contracts = await ownedContracts();
  const units = uniq([...contracts.values()].map((c) => c.unitCode));
  if (units.length === 0) return [];
  return withServiceJwt(async (jwt) => {
    // Hàm tìm theo mã căn / tên / di_dong / số HĐMB: có di_dong → một lần gọi; không thì tìm theo từng mã căn.
    const { diDong } = await customerPhones(jwt, scope);
    const rows = diDong ? await fundPage(jwt, diDong) : (await Promise.all(units.map((u) => fundPage(jwt, u)))).flat();
    return ownedHandovers(rows, scope.customerId, contracts);
  }).then(withRealProgress);
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
  return withServiceJwt(async (jwt) => {
    const phones = (await customerPhones(jwt, scope)).all;
    const or = [codes.length ? `so_hdmb.in.${inList(codes)}` : '', units.length ? `ma_sp.in.${inList(units)}` : ''].filter(Boolean).join(',');
    const rows = await restGet<(ScheduleRow & { ma_ctdk_uid: string | null })[]>(
      `bee_handover_schedules?select=${SCHEDULE_COLUMNS}&ma_ctdk_uid=eq.${encodeURIComponent(scope.companyId)}` +
        `&or=${encodeURIComponent(`(${or})`)}&order=ngay_ban_giao.desc&limit=200`,
      jwt,
    );
    // Lọc lại phía app: đúng công ty + ghép đúng khách.
    const own = (rows ?? []).filter((r) => r.ma_ctdk_uid === scope.companyId);
    return matchSchedules(own, { contractCodes: codes, unitCodes: units, phones }).map(toSchedule);
  });
}
