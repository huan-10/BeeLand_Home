import type {
  Contract,
  ContractPaymentSummary,
  InstallmentFilter,
  InstallmentStatus,
  PaymentInstallment,
  PaymentInstallmentView,
} from '@/types';

import { daysUntil } from './date';

/** Số ngày trước hạn được coi là "sắp đến hạn". */
export const UPCOMING_WINDOW_DAYS = 30;

export function getInstallmentStatus(installment: PaymentInstallment, today: Date = new Date()): InstallmentStatus {
  if (installment.paidAmount >= installment.amount) return 'paid';
  const days = daysUntil(installment.dueDate, today);
  if (days < 0) return 'overdue';
  if (installment.paidAmount > 0) return 'partial';
  if (days <= UPCOMING_WINDOW_DAYS) return 'upcoming';
  return 'scheduled';
}

export function toInstallmentView(
  installment: PaymentInstallment,
  contract: Pick<Contract, 'code' | 'projectName' | 'unitCode'>,
  today: Date = new Date(),
): PaymentInstallmentView {
  return {
    ...installment,
    status: getInstallmentStatus(installment, today),
    remainingAmount: Math.max(installment.amount - installment.paidAmount, 0),
    daysUntilDue: daysUntil(installment.dueDate, today),
    contractCode: contract.code,
    projectName: contract.projectName,
    unitCode: contract.unitCode,
  };
}

export function calcPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}

/** Đợt cần thanh toán tiếp theo: ưu tiên đợt quá hạn, sau đó là đợt có hạn gần nhất. */
export function findNextInstallment(installments: PaymentInstallmentView[]): PaymentInstallmentView | null {
  const unpaid = installments
    .filter((i) => i.status !== 'paid')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return unpaid[0] ?? null;
}

export function summarizeContractPayments(
  contract: Contract,
  installments: PaymentInstallmentView[],
): ContractPaymentSummary {
  const paidAmount = installments.reduce((sum, i) => sum + i.paidAmount, 0);
  return {
    totalValue: contract.totalValue,
    paidAmount,
    remainingAmount: Math.max(contract.totalValue - paidAmount, 0),
    paidPercent: calcPercent(paidAmount, contract.totalValue),
    installmentCount: installments.length,
    paidInstallmentCount: installments.filter((i) => i.status === 'paid').length,
    overdueCount: installments.filter((i) => i.status === 'overdue').length,
    nextInstallment: findNextInstallment(installments),
  };
}

export function filterInstallments(
  installments: PaymentInstallmentView[],
  filter: InstallmentFilter,
): PaymentInstallmentView[] {
  switch (filter) {
    case 'paid':
      return installments.filter((i) => i.status === 'paid');
    case 'due':
      return installments.filter((i) => i.status !== 'paid');
    default:
      return installments;
  }
}

/** Sắp xếp: chưa thanh toán theo hạn gần nhất trước, đã thanh toán (mới nhất) sau. */
export function sortInstallmentsForDisplay(installments: PaymentInstallmentView[]): PaymentInstallmentView[] {
  const unpaid = installments.filter((i) => i.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const paid = installments
    .filter((i) => i.status === 'paid')
    .sort((a, b) => (b.paidDate ?? b.dueDate).localeCompare(a.paidDate ?? a.dueDate));
  return [...unpaid, ...paid];
}

export interface ScheduleSummary {
  dueAmount: number;
  dueCount: number;
  overdueAmount: number;
  overdueCount: number;
  paidAmount: number;
  paidCount: number;
  /** Phần trăm đã trả trên tổng (đã trả + còn phải trả) của mọi đợt. */
  paidPercent: number;
}

export function summarizeSchedule(installments: PaymentInstallmentView[]): ScheduleSummary {
  const unpaid = installments.filter((i) => i.status !== 'paid');
  const overdue = installments.filter((i) => i.status === 'overdue');
  const dueAmount = unpaid.reduce((sum, i) => sum + i.remainingAmount, 0);
  const paidAmount = installments.reduce((sum, i) => sum + i.paidAmount, 0);
  return {
    dueAmount,
    dueCount: unpaid.length,
    overdueAmount: overdue.reduce((sum, i) => sum + i.remainingAmount, 0),
    overdueCount: overdue.length,
    paidAmount,
    paidCount: installments.length - unpaid.length,
    paidPercent: calcPercent(paidAmount, paidAmount + dueAmount),
  };
}

/** Đã thanh toán đủ 100% giá trị hợp đồng. */
export function isFullyPaid(paidPercent: number): boolean {
  return paidPercent >= 100;
}

export interface InstallmentMonthGroup {
  /** yyyy-MM */
  key: string;
  items: PaymentInstallmentView[];
  total: number;
}

/** Ngày dùng để xếp lịch: đã trả → ngày trả, chưa trả → hạn thanh toán. */
export function scheduleDate(i: PaymentInstallmentView): string {
  return i.status === 'paid' && i.paidDate ? i.paidDate : i.dueDate;
}

/** Nhóm theo tháng, giữ nguyên thứ tự danh sách đầu vào (đã sắp xếp). */
export function groupInstallmentsByMonth(items: PaymentInstallmentView[]): InstallmentMonthGroup[] {
  const groups: InstallmentMonthGroup[] = [];
  for (const item of items) {
    const key = scheduleDate(item).slice(0, 7);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, items: [], total: 0 };
      groups.push(g);
    }
    g.items.push(item);
    g.total += item.status === 'paid' ? item.paidAmount : item.remainingAmount;
  }
  return groups;
}

/** Các đợt quá hạn, quá hạn lâu nhất trước. */
export function overdueInstallments(items: PaymentInstallmentView[]): PaymentInstallmentView[] {
  return items.filter((i) => i.status === 'overdue').sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
