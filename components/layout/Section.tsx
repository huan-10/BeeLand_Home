import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Pressable, Text } from '@/components/ui';
import { colors, interactive, letterSpacing, opacity, radius, semantic, sizes, spacing } from '@/theme';

export interface SectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function Section({ title, actionLabel, onAction, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {actionLabel && onAction ? (
          // Vùng chạm cao 44 trong suốt, viên thuốc nhỏ bên trong (kiểu Beeland Sales).
          <Pressable onPress={onAction} accessibilityRole="link" accessibilityLabel={actionLabel} style={[styles.actionHit, interactive]}>
            {({ pressed, hovered }) => (
              <View style={[styles.action, hovered && styles.actionHover, pressed && styles.pressed]}>
                <Text variant="label" color={semantic.textBrand} style={styles.actionText}>
                  {actionLabel}
                </Text>
                <Icon name="chevronRight" size="xs" color={semantic.textBrand} strong />
              </View>
            )}
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.ms },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.ms },
  title: { flex: 1 },
  actionHit: { minHeight: sizes.touchTarget, justifyContent: 'center' },
  // Nút viên thuốc "Xem tất cả" (kiểu HomeSectionHeader của beeland-app_2026): nền xanh nhạt đủ thấy trên nền màn, hover đậm hơn.
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingLeft: spacing.ms,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs + spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary[100],
  },
  actionText: { letterSpacing: letterSpacing.normal },
  actionHover: { backgroundColor: colors.primary[200] },
  pressed: { opacity: opacity.pressed },
});
