import {
  filterInstallments,
  groupInstallmentsByMonth,
  overdueInstallments,
  sortInstallmentsForDisplay,
  summarizeSchedule,
} from '@/lib/payment';
import { getAllInstallments, getInstallments } from '@/services';
import type { InstallmentFilter } from '@/types';

import { useAsync } from './useAsync';

export function useInstallments(contractId: string) {
  return useAsync(() => getInstallments(contractId), [contractId]);
}

/**
 * Lịch thanh toán trên mọi hợp đồng: danh sách theo bộ lọc (chưa trả: hạn gần nhất trước;
 * đã trả: mới nhất trước), nhóm theo tháng, danh sách quá hạn và số liệu tổng hợp.
 */
export function usePaymentSchedule(filter: InstallmentFilter) {
  return useAsync(async () => {
    const all = await getAllInstallments();
    const items = sortInstallmentsForDisplay(filterInstallments(all, filter));
    return {
      summary: summarizeSchedule(all),
      overdue: overdueInstallments(all),
      items,
      groups: groupInstallmentsByMonth(items),
    };
  }, [filter]);
}
