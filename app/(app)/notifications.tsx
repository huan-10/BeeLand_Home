import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { NotificationItem } from '@/components/domain';
import { Screen } from '@/components/layout';
import { Button, EmptyState, ErrorState, ScreenHeader, SkeletonList } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/types';

export default function NotificationsScreen() {
  const { data, loading, refreshing, error, refetch, markRead, markAllRead } = useNotifications();
  const hasUnread = data?.some((n) => !n.read) ?? false;

  const open = async (n: AppNotification) => {
    if (!n.read) await markRead(n.id);
    if (n.link) router.push(n.link as Href);
  };

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader
        title="Thông báo"
        onBack={router.canGoBack() ? () => router.back() : undefined}
        right={hasUnread ? <Button title="Đọc tất cả" variant="ghost" size="sm" leftIcon="checkDouble" onPress={() => void markAllRead()} /> : undefined}
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : error || !data ? (
        <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon="bellOff" title="Chưa có thông báo" />
      ) : (
        <View className="gap-sm">
          {data.map((n) => (
            <NotificationItem key={n.id} notification={n} onPress={() => void open(n)} />
          ))}
        </View>
      )}
    </Screen>
  );
}
