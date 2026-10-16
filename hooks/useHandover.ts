import { getHandoverOverview, getHandoverSlots } from '@/services';
import { ServiceError } from '@/services/errors';

import { useAsync } from './useAsync';

/** Bàn giao căn hộ của khách (mỗi căn một dòng) + lịch nhận nhà của từng căn + hotline. */
export function useHandoverOverview() {
  return useAsync(() => getHandoverOverview(), []);
}

/** Ca + chỗ còn trong khoảng đăng ký của một căn (màn chọn lịch). */
export function useHandoverSlots(fundId: string | undefined) {
  return useAsync(() => (fundId ? getHandoverSlots(fundId) : Promise.reject(new ServiceError('Không tìm thấy căn bàn giao', 'NOT_FOUND'))), [fundId]);
}
