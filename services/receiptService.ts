import { mockReceipts } from '@/data/mock/receipts';
import { parseDate } from '@/lib/date';
import type { Receipt, ReceiptExportResult, ReceiptFilter } from '@/types';

import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';

export async function getReceipts(filter: ReceiptFilter = {}): Promise<Receipt[]> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /receipts?contractId=&year=&status=)
  await simulateLatency();
  return clone(
    mockReceipts
      .filter((r) => !filter.contractId || r.contractId === filter.contractId)
      .filter((r) => !filter.year || parseDate(r.paidDate).getFullYear() === filter.year)
      .filter((r) => !filter.status || r.status === filter.status)
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

/**
 * Xuất phiếu thu ra PDF để tải về.
 * TODO: thay bằng gọi API/database thật (ví dụ GET /receipts/:id/pdf trả về URL tệp đã ký số).
 */
export async function exportReceiptPdf(id: string): Promise<ReceiptExportResult> {
  await simulateLatency();
  if (!mockReceipts.some((r) => r.id === id)) throw new ServiceError('Không tìm thấy phiếu thu.', 'NOT_FOUND');
  return { status: 'unavailable', message: 'Tính năng tải phiếu thu PDF sắp ra mắt.' };
}

/**
 * Tạo liên kết chia sẻ phiếu thu.
 * TODO: thay bằng gọi API/database thật (ví dụ POST /receipts/:id/share trả về URL có thời hạn).
 */
export async function shareReceipt(id: string): Promise<ReceiptExportResult> {
  await simulateLatency(150, 300);
  if (!mockReceipts.some((r) => r.id === id)) throw new ServiceError('Không tìm thấy phiếu thu.', 'NOT_FOUND');
  return { status: 'unavailable', message: 'Tính năng chia sẻ phiếu thu sắp ra mắt.' };
}
