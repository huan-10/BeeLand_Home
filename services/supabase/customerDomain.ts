import {
  contractStatusFromCode,
  contractTypeFromStage,
  dateOnly,
  money,
  parseUnitCode,
  paymentMethodFromText,
} from '@/lib/portalMapping';
import { summarizeContractPayments, toInstallmentView } from '@/lib/payment';
import type { Contract, ContractListItem, PaymentInstallment, PaymentInstallmentView, Receipt } from '@/types';

import { str } from './client';
import { getCustomerRecords, getPgcSchedule, getPgcVouchers, type PgcRecord, type ScheduleRpcRow, type VoucherRow } from './customerData';

/** Một phiếu của khách → hợp đồng của app. */
export function buildContract(rec: PgcRecord): Contract {
  const { row, product, project, status } = rec;
  const hd = row.tt_hop_dong ?? {};
  const unitCode = str(product?.ky_hieu) || str(hd.MaCan) || str(product?.ma_sp);
  const { block, floor } = parseUnitCode(unitCode, product?.so_tang);
  // Giá trị: sau chiết khấu nếu có (như 2026 `TongGiaTriHDMB`); phiếu giữ chỗ / cọc chưa có giá → tiền cọc.
  const totalValue = money(row.gia_tri_hd_sau_ck ?? row.gia_tri_hd ?? row.tien_coc ?? 0);
  return {
    id: row.id,
    code: str(hd.SoPhieu) || str(row.so_phieu_gc) || unitCode || row.id.slice(0, 8).toUpperCase(),
    type: contractTypeFromStage(row.giai_doan),
    status: contractStatusFromCode(status?.item_code),
    statusLabel: str(status?.item_name) || undefined,
    customerId: str(row.khach_hang_id),
    projectName: str(project?.ten_da) || 'Dự án',
    unitCode,
    block,
    floor,
    area: Number(row.dien_tich ?? product?.dien_tich_thong_thuy ?? product?.dien_tich ?? 0) || 0,
    totalValue,
    signedDate: dateOnly(hd.NgayKy) || dateOnly(row.ngay_giu_cho) || dateOnly(row.created_at),
    salesAgent: str(hd.TenNVKD) || undefined,
    projectImageUrl: project?.imageUrl || undefined,
  };
}

/** Lịch lưu trên phiếu (khi hàm máy chủ chưa trả lịch) + phân bổ "đã thu" như web `allocatePaidToSchedule`. */
function fallbackSchedule(rec: PgcRecord): ScheduleRpcRow[] {
  const stored = (rec.row.lich_thanh_toan ?? [])
    .map((r, i) => ({
      dot: Number(r.DotTT ?? i + 1) || i + 1,
      text: str(r.DotTTText) || `Đợt ${Number(r.DotTT ?? i + 1)}`,
      date: str(r.NgayTT),
      rate: Number(r.TyLeTT) || 0,
      due: money(r.SoTien ?? r.TuongUng ?? r.PhaiThu),
      duePbt: money(r.PhaiThuPBT ?? r.PhiBT),
      note: str(r.DienGiai),
    }))
    .sort((a, b) => a.dot - b.dot);
  let remain = money(rec.row.da_thu);
  const paid = stored.map((s) => {
    const pay = Math.min(remain, s.due);
    remain -= pay;
    return pay;
  });
  const paidPbt = stored.map((s) => {
    const pay = Math.min(remain, s.duePbt);
    remain -= pay;
    return pay;
  });
  return stored.map((s, i) => ({
    dot_tt: s.dot,
    dot_tt_text: s.text,
    ngay_tt: s.date,
    ty_le_tt: s.rate,
    phai_thu: s.due,
    da_thu: paid[i],
    phai_thu_pbt: s.duePbt,
    da_thu_pbt: paidPbt[i],
    dien_giai: s.note,
  }));
}

/** Đợt thanh toán = phần gốc + phí bảo trì của đợt (tổng các đợt khớp giá trị HĐ gồm PBT). */
export function buildInstallments(rec: PgcRecord, schedule: ScheduleRpcRow[]): PaymentInstallment[] {
  const rows = schedule.length ? schedule : fallbackSchedule(rec);
  return rows
    .filter((r) => dateOnly(r.ngay_tt))
    .map((r) => {
      const pbt = money(r.phai_thu_pbt);
      return {
        id: `${rec.row.id}_${r.dot_tt}`,
        contractId: rec.row.id,
        sequence: Number(r.dot_tt) || 0,
        name: str(r.dot_tt_text) || `Đợt ${r.dot_tt}`,
        description: [str(r.dien_giai), pbt > 0 ? 'Bao gồm phí bảo trì' : ''].filter(Boolean).join(' · ') || undefined,
        percentOfContract: Number(r.ty_le_tt) || 0,
        amount: money(r.phai_thu) + pbt,
        paidAmount: money(r.da_thu) + money(r.da_thu_pbt),
        dueDate: dateOnly(r.ngay_tt),
      };
    })
    .sort((a, b) => a.sequence - b.sequence);
}

export interface ContractBundle {
  record: PgcRecord;
  contract: Contract;
  installments: PaymentInstallmentView[];
  item: ContractListItem;
}

function bundleOf(record: PgcRecord, schedule: ScheduleRpcRow[]): ContractBundle {
  const contract = buildContract(record);
  const installments = buildInstallments(record, schedule).map((i) => toInstallmentView(i, contract));
  const summary = summarizeContractPayments(contract, installments);
  // Phiếu chưa có lịch (giữ chỗ / cọc): "đã thu" lấy cột da_thu của server (như 2026).
  if (installments.length === 0) {
    const paid = Math.min(money(record.row.da_thu), contract.totalValue || money(record.row.da_thu));
    summary.paidAmount = paid;
    summary.remainingAmount = Math.max(contract.totalValue - paid, 0);
    summary.paidPercent = contract.totalValue > 0 ? Math.min(100, (paid / contract.totalValue) * 100) : 0;
  }
  return { record, contract, installments, item: { ...contract, summary } };
}

/** Toàn bộ hợp đồng + lịch thanh toán của khách đang đăng nhập. */
export async function getContractBundles(force = false): Promise<ContractBundle[]> {
  const records = await getCustomerRecords(force);
  const schedules = await Promise.all(records.map((r) => getPgcSchedule(r.row.id, force).catch(() => [] as ScheduleRpcRow[])));
  return records.map((r, i) => bundleOf(r, schedules[i]));
}

export async function getContractBundle(id: string, force = false): Promise<ContractBundle> {
  const bundles = await getContractBundles(force);
  const found = bundles.find((b) => b.contract.id === id);
  if (!found) throw new Error('NOT_FOUND');
  return found;
}

/** Phiếu thu → kiểu của app. Một tờ có thể chia cho nhiều phiếu → id gồm cả phiếu. */
export function buildReceipt(contract: Contract, v: VoucherRow, payerFallback: string): Receipt {
  return {
    id: `${v.id}_${contract.id}`,
    code: str(v.so_phieu) || v.id.slice(0, 8).toUpperCase(),
    status: 'paid',
    contractId: contract.id,
    contractCode: contract.code,
    projectName: contract.projectName,
    unitCode: str(v.ky_hieu) || contract.unitCode,
    amount: money(v.so_tien_pgc ?? v.so_tien),
    paidDate: dateOnly(v.ngay_phieu),
    method: paymentMethodFromText(v.hinh_thuc),
    payerName: str(v.nguoi_nop) || payerFallback,
    content: str(v.dien_giai),
    cashier: '',
  };
}

/** Phiếu thu của mọi hợp đồng của khách (mỗi phiếu chỉ lấy theo hợp đồng thuộc khách). */
export async function getCustomerReceipts(payerFallback: string, contractId?: string, force = false): Promise<Receipt[]> {
  const bundles = (await getContractBundles(force)).filter((b) => !contractId || b.contract.id === contractId);
  const lists = await Promise.all(
    bundles.map(async (b) => (await getPgcVouchers(b.contract.id, force)).map((v) => buildReceipt(b.contract, v, payerFallback))),
  );
  return lists.flat().sort((a, b) => b.paidDate.localeCompare(a.paidDate));
}
