import type { Receipt, ReceiptGroup, ReceiptTab } from '@/types';

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

/** Nhóm theo hợp đồng; nhóm có phiếu mới nhất đứng trước, phiếu trong nhóm mới nhất trước. */
export function groupReceiptsByContract(receipts: Receipt[]): ReceiptGroup[] {
  const groups = new Map<string, ReceiptGroup>();
  for (const r of sortReceiptsByDate(receipts)) {
    const g = groups.get(r.contractId) ?? {
      contractId: r.contractId,
      contractCode: r.contractCode,
      projectName: r.projectName,
      unitCode: r.unitCode,
      receipts: [],
      paidTotal: 0,
    };
    g.receipts.push(r);
    if (isPaidReceipt(r)) g.paidTotal += r.amount;
    groups.set(r.contractId, g);
  }
  return [...groups.values()];
}

export function filterReceiptsByTab(receipts: Receipt[], tab: ReceiptTab): Receipt[] {
  return tab === 'paid' ? receipts.filter(isPaidReceipt) : receipts;
}

export interface ReceiptTabCounts {
  all: number;
  paid: number;
  /** Số hợp đồng có phiếu thu. */
  byContract: number;
}

export function countReceiptTabs(receipts: Receipt[]): ReceiptTabCounts {
  return {
    all: receipts.length,
    paid: receipts.filter(isPaidReceipt).length,
    byContract: new Set(receipts.map((r) => r.contractId)).size,
  };
}
