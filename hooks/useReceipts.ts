import { useMemo } from 'react';

import {
  countReceiptTabs,
  filterReceiptsByTab,
  groupReceiptsByContract,
  sortReceiptsByDate,
  sumPaidReceipts,
} from '@/lib/receipt';
import { getReceiptById, getReceipts } from '@/services';
import type { ReceiptFilter, ReceiptTab } from '@/types';

import { useAsync } from './useAsync';

export function useReceipts(filter: ReceiptFilter = {}) {
  return useAsync(() => getReceipts(filter), [filter.contractId, filter.year, filter.status]);
}

/** Màn Phiếu thu: danh sách theo tab, nhóm theo hợp đồng, số lượng từng tab và tổng đã thu. */
export function useReceiptList(tab: ReceiptTab) {
  const state = useReceipts();
  const derived = useMemo(() => {
    const all = state.data ?? [];
    const receipts = sortReceiptsByDate(filterReceiptsByTab(all, tab));
    return {
      receipts,
      groups: tab === 'byContract' ? groupReceiptsByContract(all) : [],
      counts: countReceiptTabs(all),
      paidTotal: sumPaidReceipts(all),
    };
  }, [state.data, tab]);
  return { ...state, ...derived };
}

export function useReceipt(id: string | undefined) {
  return useAsync(async () => {
    if (!id) throw new Error('missing id');
    return getReceiptById(id);
  }, [id]);
}
