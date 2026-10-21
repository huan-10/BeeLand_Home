import type { PayTarget, PaymentInstallmentView } from '@/types';

import { formatCurrency, formatDate, formatDaysLeft } from './format';

type InstallmentTextInput = Pick<PaymentInstallmentView, 'status' | 'dueDate' | 'daysUntilDue' | 'paidDate'>;

/**
 * Ngày của đợt trong lịch thanh toán: đã trả hết → ngày trả (không có ngày trả thì chỉ hạn, không đếm "Quá hạn N ngày");
 * chưa trả hết → hạn + số ngày còn lại / quá hạn.
 */
export function installmentDateText(i: InstallmentTextInput): string {
  if (i.status === 'paid') return i.paidDate ? `Đã thanh toán ngày ${formatDate(i.paidDate)}` : `Hạn ${formatDate(i.dueDate)}`;
  return `Hạn ${formatDate(i.dueDate)} · ${formatDaysLeft(i.daysUntilDue)}`;
}

export interface InstallmentBreakdown {
  /** Các khoản cộng thành tổng đợt: tiền căn hộ, phí bảo trì (nếu có). */
  lines: { label: string; value: string }[];
  totalText: string;
  /** "− 62.574.120 đ"; chưa trả gì → null. */
  paidText: string | null;
  /** Cùng số "còn lại" ở thanh Thanh toán. */
  remainingText: string;
}

/**
 * Bảng kê của một đợt (ẩn/hiện ở lịch thanh toán): tiền căn hộ + phí bảo trì = tổng đợt, trừ đã trả = còn phải trả.
 * Có cho mọi đợt, kể cả đợt đã trả hết.
 */
export function installmentBreakdown(
  i: Pick<PaymentInstallmentView, 'amount' | 'paidAmount' | 'remainingAmount' | 'maintenanceFee' | 'percentOfContract'>,
): InstallmentBreakdown {
  const fee = i.maintenanceFee ?? 0;
  const lines = [{ label: `Tiền căn hộ (${i.percentOfContract}% HĐ)`, value: formatCurrency(i.amount - fee) }];
  if (fee > 0) lines.push({ label: 'Phí bảo trì', value: formatCurrency(fee) });
  return {
    lines,
    totalText: formatCurrency(i.amount),
    paidText: i.paidAmount > 0 ? `− ${formatCurrency(i.paidAmount)}` : null,
    remainingText: formatCurrency(i.remainingAmount),
  };
}

/** Số chính của đợt: đã trả một phần → "Còn phải trả" + phần còn lại (cùng số ở thanh Thanh toán); còn lại → tổng đợt. */
export function installmentHeadline(i: Pick<PaymentInstallmentView, 'amount' | 'paidAmount' | 'remainingAmount'>): {
  label: string | null;
  amountText: string;
} {
  if (i.paidAmount > 0 && i.remainingAmount > 0) return { label: 'Còn phải trả', amountText: formatCurrency(i.remainingAmount) };
  return { label: null, amountText: formatCurrency(i.amount) };
}

/** Nhãn khoản ở thanh Thanh toán: đợt HĐ → "Còn phải trả · Đợt N" (số tiền là phần còn lại của đợt); khoản khác giữ tên. */
export function payTargetLabel(t: Pick<PayTarget, 'module' | 'name'>): string {
  return t.module === 'HOPDONG' ? `Còn phải trả · ${t.name}` : t.name;
}
