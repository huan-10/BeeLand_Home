import { mockReceipts } from '@/data/mock/receipts';
import { parseDate } from '@/lib/date';
import type { Receipt, ReceiptFilter } from '@/types';

import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';

export async function getReceipts(filter: ReceiptFilter = {}): Promise<Receipt[]> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /receipts?contractId=&year=)
  await simulateLatency();
  return clone(
    mockReceipts
      .filter((r) => !filter.contractId || r.contractId === filter.contractId)
      .filter((r) => !filter.year || parseDate(r.paidDate).getFullYear() === filter.year)
      .sort((a, b) => b.paidDate.localeCompare(a.paidDate)),
  );
}

export async function getReceiptById(id: string): Promise<Receipt> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /receipts/:id)
  await simulateLatency();
  const receipt = mockReceipts.find((r) => r.id === id);
  if (!receipt) throw new ServiceError('Không tìm thấy phiếu thu.', 'NOT_FOUND');
  return clone(receipt);
}
