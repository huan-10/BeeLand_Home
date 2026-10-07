import { getMyRequest, getMyRequests, getRequestOptions } from '@/services';

import { useAsync } from './useAsync';

/** Yêu cầu của khách (mới nhất trước). */
export function useMyRequests() {
  return useAsync(() => getMyRequests(), []);
}

export function useMyRequest(id: string | undefined) {
  return useAsync(async () => {
    if (!id) throw new Error('missing id');
    return getMyRequest(id);
  }, [id]);
}

/** Loại yêu cầu + hợp đồng của khách để chọn khi gửi. */
export function useRequestOptions() {
  return useAsync(() => getRequestOptions(), []);
}
