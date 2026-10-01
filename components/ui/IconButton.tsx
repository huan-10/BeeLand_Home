import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, interactive, radius, semantic, sizes, spacing, type IconName } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface IconButtonProps {
  icon: IconName;
  /** Bắt buộc: tên truy cập cho nút chỉ có icon. */
  accessibilityLabel: string;
  onPress: () => void;
  /** Số đếm hiển thị góc trên (ví dụ thông báo chưa đọc). */
  badgeCount?: number;
}

/** Nút vuông 44×44 chỉ có icon, viền mảnh. */
export function IconButton({ icon, accessibilityLabel, onPress, badgeCount }: IconButtonProps) {
  const label = badgeCount ? `${accessibilityLabel}, ${badgeCount} chưa đọc` : accessibilityLabel;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, interactive, pressed && styles.pressed]}>
      <Icon name={icon} size="lg" color={semantic.icon} />
      {badgeCount ? (
        <View style={styles.badge}>
          <Text variant="caption" weight="bold" color={semantic.textOnPrimary}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.md,
    backgroundColor: semantic.surface,
    borderWidth: borderWidth.hairline,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.gray[100] },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    minWidth: sizes.countBadge,
    height: sizes.countBadge,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.danger[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.strong,
    borderColor: semantic.surface,
  },
});
