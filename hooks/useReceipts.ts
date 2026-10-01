import { useMemo } from 'react';

import { filterReceiptsByYear, getReceiptYears, sumReceipts } from '@/lib/receipt';
import { getReceiptById, getReceipts } from '@/services';
import type { ReceiptFilter } from '@/types';

import { useAsync } from './useAsync';

export function useReceipts(filter: ReceiptFilter = {}) {
  return useAsync(() => getReceipts(filter), [filter.contractId, filter.year]);
}

/** Danh sách phiếu thu có lọc theo năm, kèm danh sách năm và tổng tiền. */
export function useReceiptList(year: number | 'all') {
  const state = useReceipts();
  const derived = useMemo(() => {
    const all = state.data ?? [];
    const receipts = filterReceiptsByYear(all, year);
    return { receipts, years: getReceiptYears(all), total: sumReceipts(receipts) };
  }, [state.data, year]);
  return { ...state, ...derived };
}

export function useReceipt(id: string | undefined) {
  return useAsync(async () => {
    if (!id) throw new Error('missing id');
    return getReceiptById(id);
  }, [id]);
}
