import { Pressable, StyleSheet, View } from 'react-native';

import { IconCircle, Text } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
import { notificationTypeMeta } from '@/lib/labels';
import { colors, radius } from '@/theme';
import type { AppNotification } from '@/types';

export function NotificationItem({ notification, onPress }: { notification: AppNotification; onPress?: () => void }) {
  const meta = notificationTypeMeta[notification.type];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.item, !notification.read && styles.unread, pressed && styles.pressed]}>
      <IconCircle name={meta.icon} tone={meta.tone} size={40} />
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <Text variant="smallMedium" weight="semibold" style={styles.flex} numberOfLines={2}>
            {notification.title}
          </Text>
          {!notification.read ? <View style={styles.dot} /> : null}
        </View>
        <Text variant="small" color={colors.gray[600]} numberOfLines={3}>
          {notification.message}
        </Text>
        <Text variant="caption" color={colors.gray[400]}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.white },
  unread: { backgroundColor: colors.primary[50] },
  pressed: { opacity: 0.85 },
  main: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flex: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500], marginTop: 6 },
});
