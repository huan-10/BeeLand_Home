import { useMemo } from 'react';

import { buildPaymentsView } from '@/lib/paymentsView';
import { getAllInstallments, getReceipts } from '@/services';

import { useAsync } from './useAsync';

/**
 * Màn Thanh toán: tải lịch thanh toán + phiếu thu một lần; tab và lọc căn tính ngay trên máy (đổi không tải lại).
 */
export function usePaymentsView(unit: string | null) {
  const state = useAsync(() => Promise.all([getAllInstallments(), getReceipts()]), []);
  const data = useMemo(() => (state.data ? buildPaymentsView(state.data[0], state.data[1], unit) : undefined), [state.data, unit]);
  return { ...state, data };
}
