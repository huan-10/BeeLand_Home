import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { borderWidth, interactive, motion, opacity, radius, semantic, sizes, spacing, toneColors, type IconName, type Tone } from '@/theme';

import { IconCircle } from './IconCircle';
import { Text } from './Text';

export interface ActionTileProps {
  label: string;
  icon: IconName;
  tone: Tone;
  onPress: () => void;
  accessibilityHint?: string;
  /** Màn hẹp: icon và chữ nhỏ hơn để 4 ô vừa một hàng. */
  compact?: boolean;
}

/**
 * Ô chức năng: icon pastel + nhãn. Web: hover đổi nền/viền theo tông (không đổi kích thước);
 * nhấn: giảm opacity; focus: viền `:focus-visible` toàn cục.
 */
export function ActionTile({ label, icon, tone, onPress, accessibilityHint, compact }: ActionTileProps) {
  const [hovered, setHovered] = useState(false);
  const c = toneColors[tone];
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.tile,
        interactive,
        hovered && { backgroundColor: c.bg, borderColor: c.border },
        pressed && styles.pressed,
      ]}>
      <IconCircle name={icon} tone={tone} size={compact ? 'lg' : 'xl'} />
      <Text variant={compact ? 'caption' : 'smallMedium'} weight="semibold" align="center" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: sizes.actionTile.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: semantic.surface,
    borderWidth: borderWidth.hairline,
    borderColor: semantic.borderSubtle,
    // Web: chuyển màu mượt khi hover.
    transitionDuration: `${motion.fast}ms`,
  },
  pressed: { opacity: opacity.pressed },
});
