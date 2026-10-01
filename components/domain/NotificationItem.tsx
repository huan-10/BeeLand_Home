import { Pressable, StyleSheet, View } from 'react-native';

import { IconCircle, Text } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
import { notificationTypeMeta } from '@/lib/labels';
import { useHover } from '@/hooks/useHover';
import { colors, interactive, opacity, radius, semantic, shadows, sizes, spacing } from '@/theme';
import type { AppNotification } from '@/types';

export function NotificationItem({ notification, onPress }: { notification: AppNotification; onPress?: () => void }) {
  const { hovered, hoverProps } = useHover();
  const meta = notificationTypeMeta[notification.type];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${notification.read ? '' : 'Chưa đọc. '}${notification.title}`}
      accessibilityHint={notification.message}
      {...hoverProps}
      style={({ pressed }) => [
        styles.item,
        interactive,
        !notification.read && styles.unread,
        hovered && (notification.read ? styles.hover : styles.unreadHover),
        pressed && styles.pressed,
      ]}>
      <IconCircle name={meta.icon} tone={meta.tone} size="md" />
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <Text variant="captionStrong" weight="semibold" style={styles.flex}>
            {notification.title}
          </Text>
          {!notification.read ? <View style={styles.dot} /> : null}
        </View>
        <Text variant="caption" color={semantic.textSecondary}>
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
  item: {
    flexDirection: 'row',
    gap: spacing.ms,
    padding: spacing.md,
    borderRadius: radius['2xl'],
    backgroundColor: semantic.surface,
    ...shadows.soft,
  },
  unread: { backgroundColor: colors.primary[50] },
  hover: { backgroundColor: semantic.surfaceMuted, ...shadows.raised },
  unreadHover: { backgroundColor: colors.primary[100], ...shadows.raised },
  pressed: { opacity: opacity.pressed },
  main: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  dot: { width: sizes.dot.md, height: sizes.dot.md, borderRadius: radius.full, backgroundColor: semantic.brand, marginTop: spacing.xs + spacing.xs },
});
