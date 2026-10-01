import { filterInstallments, sortInstallmentsForDisplay, summarizeSchedule } from '@/lib/payment';
import { getAllInstallments, getInstallments } from '@/services';
import type { InstallmentFilter } from '@/types';

import { useAsync } from './useAsync';

export function useInstallments(contractId: string) {
  return useAsync(() => getInstallments(contractId), [contractId]);
}

/** Lịch thanh toán trên mọi hợp đồng: danh sách đã lọc/sắp xếp kèm số liệu tổng hợp. */
export function usePaymentSchedule(filter: InstallmentFilter) {
  return useAsync(async () => {
    const all = await getAllInstallments();
    return {
      summary: summarizeSchedule(all),
      items: sortInstallmentsForDisplay(filterInstallments(all, filter)),
    };
  }, [filter]);
}
