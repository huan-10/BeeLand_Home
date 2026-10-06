import { mockSeller } from '@/data/mock/contractDetails';
import { mockReceipts } from '@/data/mock/receipts';
import { parseDate } from '@/lib/date';
import { buildReceiptHtml, receiptFileName, receiptShareText } from '@/lib/receiptPdf';
import type { Receipt, ReceiptFilter } from '@/types';

import { AUTH_BACKEND } from './config';
import { isNoxhOnlySession } from './session';
import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';
import { getSellerCompany } from './supabase/customerData';
import { getCustomerReceipts } from './supabase/customerDomain';

/** Phiếu thu của KHÁCH ĐANG ĐĂNG NHẬP (chỉ theo các hợp đồng thuộc khách). */
export async function getReceipts(filter: ReceiptFilter = {}): Promise<Receipt[]> {
  if (isNoxhOnlySession()) return [];
  if (AUTH_BACKEND === 'api') {
    return (await getCustomerReceipts('', filter.contractId))
      .filter((r) => !filter.year || parseDate(r.paidDate).getFullYear() === filter.year)
      .filter((r) => !filter.status || r.status === filter.status);
  }
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
  if (isNoxhOnlySession()) throw new ServiceError('Không tìm thấy phiếu thu.', 'NOT_FOUND');
  if (AUTH_BACKEND === 'api') {
    const receipt = (await getCustomerReceipts('')).find((r) => r.id === id);
    if (!receipt) throw new ServiceError('Không tìm thấy phiếu thu.', 'NOT_FOUND');
    return receipt;
  }
  await simulateLatency();
  const receipt = mockReceipts.find((r) => r.id === id);
  if (!receipt) throw new ServiceError('Không tìm thấy phiếu thu.', 'NOT_FOUND');
  return clone(receipt);
}

/** Phiếu thu + HTML mẫu 01-TT + tên tệp — để lưu / chia sẻ PDF (`receiptFile`). */
export interface ReceiptDocument {
  receipt: Receipt;
  html: string;
  fileName: string;
  shareText: string;
}

/**
 * Dựng phiếu thu PDF ngay trên máy từ dữ liệu phiếu (CHỈ ĐỌC): thông tin đơn vị = công ty của tài khoản (`cloud_companies`).
 * Database chưa có tệp phiếu thu ký số → bản điện tử để tra cứu, ghi rõ trên phiếu.
 */
export async function getReceiptDocument(id: string): Promise<ReceiptDocument> {
  const receipt = await getReceiptById(id);
  const company =
    AUTH_BACKEND === 'api'
      ? await getSellerCompany().then((c) => ({ name: c?.ten_ct ?? '', address: c?.dia_chi ?? '' }))
      : { name: mockSeller.companyName, address: mockSeller.address };
  return { receipt, html: buildReceiptHtml(receipt, company), fileName: receiptFileName(receipt.code), shareText: receiptShareText(receipt) };
}
