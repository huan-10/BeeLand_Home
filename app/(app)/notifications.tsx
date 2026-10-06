import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout';
import { Badge, Button, Card, EmptyState, ErrorState, ListRow, ScreenHeader, SkeletonList, Text } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/format';
import { notificationTypeMeta } from '@/lib/labels';
import { semantic, sizes, spacing } from '@/theme';
import type { AppNotification } from '@/types';

export default function NotificationsScreen() {
  const { data, loading, refreshing, error, refetch, markRead, markAllRead, unreadCount } = useNotifications();
  const hasUnread = data?.some((n) => !n.read) ?? false;

  const open = async (n: AppNotification) => {
    if (!n.read) await markRead(n.id);
    if (n.link) router.push(n.link as Href, { withAnchor: true });
  };

  return (
    <Screen
      onRefresh={() => void refetch()}
      refreshing={refreshing}
      top={<ScreenHeader title="Thông báo" onBack={router.canGoBack() ? () => router.back() : undefined} />}
      sticky={() =>
        data && data.length > 0 ? (
          <View style={styles.bar}>
            <Text variant="captionStrong" weight="semibold" color={hasUnread ? semantic.textBrand : semantic.textMuted} style={styles.flex}>
              {hasUnread ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}
            </Text>
            {hasUnread ? <Button title="Đọc tất cả" variant="secondary" size="sm" leftIcon="checkDouble" onPress={() => void markAllRead()} /> : null}
          </View>
        ) : null
      }>

      {loading ? (
        <SkeletonList count={4} />
      ) : error || !data ? (
        <Card>
          <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon="bellOff" title="Chưa có thông báo" description="Nhắc lịch thanh toán và cập nhật dự án sẽ hiển thị tại đây." />
        </Card>
      ) : (
        // Mỗi thông báo một thẻ riêng — cùng kiểu khối Thông báo ở Trang chủ (RecentSection của beeland-app_2026).
        <View style={styles.list}>
          {data.map((n) => {
            const meta = notificationTypeMeta[n.type];
            return (
              <ListRow
                key={n.id}
                card
                icon={meta.icon}
                tone={meta.tone}
                title={n.title}
                subtitle={n.message}
                subtitleLines={3}
                footnote={formatRelativeTime(n.createdAt)}
                aside={!n.read ? <Badge label="Mới" tone="primary" /> : undefined}
                onPress={() => void open(n)}
                accessibilityLabel={`${n.read ? '' : 'Chưa đọc. '}${n.title}. ${n.message}. ${formatRelativeTime(n.createdAt)}`}
              />
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, minHeight: sizes.touchTarget },
  flex: { flex: 1, minWidth: 0 },
  list: { gap: spacing.ms },
});
