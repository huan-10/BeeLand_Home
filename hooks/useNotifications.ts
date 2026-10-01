import { useCallback, useMemo } from 'react';

import { countUnread, latestNotifications } from '@/lib/notification';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services';

import { useAsync } from './useAsync';

export function useNotifications() {
  const state = useAsync(getNotifications, []);
  const { refetch, data } = state;

  const unreadCount = useMemo(() => countUnread(data ?? []), [data]);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      await refetch();
    },
    [refetch],
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    await refetch();
  }, [refetch]);

  return { ...state, unreadCount, markRead, markAllRead };
}

/** N thông báo mới nhất cho khối trên Trang chủ. */
export function useLatestNotifications(limit: number) {
  const state = useNotifications();
  const items = useMemo(() => latestNotifications(state.data ?? [], limit), [state.data, limit]);
  return { ...state, items };
}
