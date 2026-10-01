import { useCallback } from 'react';

import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services';

import { useAsync } from './useAsync';

export function useNotifications() {
  const state = useAsync(getNotifications, []);
  const { refetch } = state;

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

  return { ...state, markRead, markAllRead };
}
