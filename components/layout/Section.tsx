import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { colors, interactive, opacity, radius, semantic, sizes, spacing, toneColors } from '@/theme';

export interface SectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function Section({ title, actionLabel, onAction, children }: SectionProps) {
  const { hovered, hoverProps } = useHover();
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="link"
            {...hoverProps}
            style={({ pressed }) => [styles.action, interactive, hovered && styles.actionHover, pressed && styles.pressed]}>
            <Text variant="captionStrong" weight="semibold" color={semantic.textBrand}>
              {actionLabel}
            </Text>
            <Icon name="chevronRight" size="sm" color={semantic.textBrand} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.ms },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  // Nút viên thuốc "Xem tất cả": nền cam pastel, hover đậm hơn.
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.touchTarget,
    paddingLeft: spacing.md,
    paddingRight: spacing.ms,
    borderRadius: radius.full,
    backgroundColor: toneColors.primary.bg,
  },
  actionHover: { backgroundColor: colors.primary[100] },
  pressed: { opacity: opacity.pressed },
});
