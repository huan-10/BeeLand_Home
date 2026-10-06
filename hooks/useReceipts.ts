import { getReceiptById, getReceipts } from '@/services';
import type { ReceiptFilter } from '@/types';

import { useAsync } from './useAsync';

export function useReceipts(filter: ReceiptFilter = {}) {
  return useAsync(() => getReceipts(filter), [filter.contractId, filter.year, filter.status]);
}

export function useReceipt(id: string | undefined) {
  return useAsync(async () => {
    if (!id) throw new Error('missing id');
    return getReceiptById(id);
  }, [id]);
}
