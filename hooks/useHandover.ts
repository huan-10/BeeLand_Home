import { getHandovers, getHandoverSchedules } from '@/services';

import { useAsync } from './useAsync';

/** Bàn giao căn hộ của khách (mỗi căn một dòng). */
export function useHandovers() {
  return useAsync(() => getHandovers(), []);
}

/** Lịch bàn giao của khách + hotline. */
export function useHandoverSchedules() {
  return useAsync(() => getHandoverSchedules(), []);
}
