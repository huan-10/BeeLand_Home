import type { PaymentInstallmentView, Receipt } from '@/types';

import { filterInstallments, groupInstallmentsByMonth, sortInstallmentsForDisplay, summarizeSchedule, type InstallmentMonthGroup } from './payment';
import { sortReceiptsByDate, sumPaidReceipts } from './receipt';
import { activeUnit, filterByUnit, unitCodesOf } from './unitFilter';

export interface PaymentsSummary {
  dueAmount: number;
  dueCount: number;
  overdueAmount: number;
  overdueCount: number;
  /** Tổng phiếu "Đã thanh toán" (bỏ chờ xác nhận / đã hủy). */
  paidTotal: number;
  /** Số phiếu thu trong tab Đã thanh toán. */
  receiptCount: number;
}

export interface PaymentsView {
  /** Mã căn có trong lịch thanh toán hoặc phiếu thu. */
  units: string[];
  /** Căn đang lọc (null = tất cả). */
  unit: string | null;
  /** Tab Cần thanh toán: đợt chưa trả, hạn gần nhất trước. */
  due: PaymentInstallmentView[];
  dueGroups: InstallmentMonthGroup[];
  /** Tab Đã thanh toán: phiếu thu, mới nhất trước. */
  receipts: Receipt[];
  summary: PaymentsSummary;
}

/**
 * Màn Thanh toán gộp: "Cần thanh toán" = lịch thanh toán chưa trả, "Đã thanh toán" = phiếu thu.
 * Lọc căn dùng chung cho hai tab và thẻ thông tin chung.
 */
export function buildPaymentsView(installments: PaymentInstallmentView[], receipts: Receipt[], unit: string | null): PaymentsView {
  const units = unitCodesOf([...installments, ...receipts]);
  const shown = activeUnit(units, unit);
  const scopedInst = filterByUnit(installments, shown);
  const scopedRec = sortReceiptsByDate(filterByUnit(receipts, shown));
  const due = sortInstallmentsForDisplay(filterInstallments(scopedInst, 'due'));
  const s = summarizeSchedule(scopedInst);
  return {
    units,
    unit: shown,
    due,
    dueGroups: groupInstallmentsByMonth(due),
    receipts: scopedRec,
    summary: {
      dueAmount: s.dueAmount,
      dueCount: s.dueCount,
      overdueAmount: s.overdueAmount,
      overdueCount: s.overdueCount,
      paidTotal: sumPaidReceipts(scopedRec),
      receiptCount: scopedRec.length,
    },
  };
}
