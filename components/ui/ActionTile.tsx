import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { interactive, letterSpacing, motion, opacity, radius, semantic, shadows, sizes, spacing, toneColors, type IconName, type Tone } from '@/theme';

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
 * Ô chức năng: thẻ trắng bo 24, icon tròn pastel + nhãn. Web: hover nền theo tông + bóng `raised` (không đổi kích thước);
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
        hovered && [styles.hovered, { backgroundColor: c.bg }],
        pressed && styles.pressed,
      ]}>
      <IconCircle name={icon} tone={tone} size={compact ? 'lg' : 'xl'} />
      <Text variant={compact ? 'label' : 'captionStrong'} weight="semibold" align="center" style={compact && styles.compactLabel}>
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
    borderRadius: radius['2xl'],
    backgroundColor: semantic.surface,
    ...shadows.soft,
    // Web: chuyển màu mượt khi hover.
    transitionDuration: `${motion.fast}ms`,
  },
  hovered: shadows.raised,
  // Ô hẹp: nhãn 12 không giãn chữ để vừa 4 ô một hàng.
  compactLabel: { letterSpacing: letterSpacing.normal },
  pressed: { opacity: opacity.pressed },
});
