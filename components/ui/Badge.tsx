import { StyleSheet, View } from 'react-native';

import { radius, sizes, spacing, toneColors, type IconName, type Tone } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  /** Chấm tròn màu phía trước nhãn (màu luôn đi kèm chữ, không dùng màu đơn lẻ). */
  dot?: boolean;
  size?: 'sm' | 'md';
}

/** Badge viên thuốc pastel: nền nhạt + chữ đậm cùng tông, luôn có chữ (màu không là tín hiệu duy nhất). */
export function Badge({ label, tone = 'neutral', icon, dot, size = 'sm' }: BadgeProps) {
  const c = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, size === 'md' && styles.md]} accessibilityRole="text" accessibilityLabel={label}>
      {dot ? <View style={[styles.dot, { backgroundColor: c.solid }]} /> : null}
      {icon ? <Icon name={icon} size="xs" color={c.fg} /> : null}
      <Text variant="label" color={c.fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    // Badge giữ nguyên một dòng; phần tử bên cạnh co lại thay vì cắt nhãn (skill: compact label overflow).
    flexShrink: 0,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  md: { paddingHorizontal: spacing.ms, paddingVertical: spacing.xs },
  dot: { width: sizes.dot.sm, height: sizes.dot.sm, borderRadius: radius.full },
});
