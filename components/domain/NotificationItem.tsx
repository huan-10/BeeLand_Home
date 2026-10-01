import { Pressable, StyleSheet, View } from 'react-native';

import { IconCircle, Text } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
import { notificationTypeMeta } from '@/lib/labels';
import { colors, interactive, opacity, radius, semantic, sizes, spacing } from '@/theme';
import type { AppNotification } from '@/types';

export function NotificationItem({ notification, onPress }: { notification: AppNotification; onPress?: () => void }) {
  const meta = notificationTypeMeta[notification.type];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${notification.read ? '' : 'Chưa đọc. '}${notification.title}`}
      accessibilityHint={notification.message}
      style={({ pressed }) => [styles.item, interactive, !notification.read && styles.unread, pressed && styles.pressed]}>
      <IconCircle name={meta.icon} tone={meta.tone} size="md" />
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <Text variant="smallMedium" weight="semibold" style={styles.flex} numberOfLines={2}>
            {notification.title}
          </Text>
          {!notification.read ? <View style={styles.dot} /> : null}
        </View>
        <Text variant="small" color={semantic.textSecondary} numberOfLines={3}>
          {notification.message}
        </Text>
        <Text variant="caption" color={semantic.textMuted}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.ms, padding: spacing.md, borderRadius: radius.lg, backgroundColor: semantic.surface },
  unread: { backgroundColor: colors.primary[50] },
  pressed: { opacity: opacity.pressed },
  main: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  dot: { width: sizes.dot.md, height: sizes.dot.md, borderRadius: radius.full, backgroundColor: semantic.brand, marginTop: spacing.xs + spacing['2xs'] },
});
