import type { Receipt } from '@/types';

import { parseDate } from './date';

export function getReceiptYear(receipt: Receipt): number {
  return parseDate(receipt.paidDate).getFullYear();
}

/** Các năm có phiếu thu, mới nhất trước. */
export function getReceiptYears(receipts: Receipt[]): number[] {
  return [...new Set(receipts.map(getReceiptYear))].sort((a, b) => b - a);
}

export function filterReceiptsByYear(receipts: Receipt[], year: number | 'all'): Receipt[] {
  return year === 'all' ? receipts : receipts.filter((r) => getReceiptYear(r) === year);
}

export function sumReceipts(receipts: Receipt[]): number {
  return receipts.reduce((sum, r) => sum + r.amount, 0);
}
