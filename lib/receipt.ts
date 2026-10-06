import type { Receipt } from '@/types';

import { parseDate } from './date';

export function getReceiptYear(receipt: Receipt): number {
  return parseDate(receipt.paidDate).getFullYear();
}

export function isPaidReceipt(receipt: Receipt): boolean {
  return receipt.status === 'paid';
}

/** Tổng tiền đã thu — chỉ tính phiếu "Đã thanh toán" (bỏ phiếu chờ xác nhận / đã hủy). */
export function sumPaidReceipts(receipts: Receipt[]): number {
  return receipts.filter(isPaidReceipt).reduce((sum, r) => sum + r.amount, 0);
}

/** Phiếu mới nhất trước. */
export function sortReceiptsByDate(receipts: Receipt[]): Receipt[] {
  return [...receipts].sort((a, b) => b.paidDate.localeCompare(a.paidDate));
}
