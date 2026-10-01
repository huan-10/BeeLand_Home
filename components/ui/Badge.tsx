import { StyleSheet, View } from 'react-native';

import { radius, toneColors, type IconName, type Tone } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  /** Hiển thị chấm tròn màu phía trước nhãn. */
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function Badge({ label, tone = 'neutral', icon, dot, size = 'sm' }: BadgeProps) {
  const c = toneColors[tone];
  return (
    <View
      style={[styles.badge, { backgroundColor: c.bg }, size === 'md' && styles.md]}
      accessibilityRole="text">
      {dot ? <View style={[styles.dot, { backgroundColor: c.solid }]} /> : null}
      {icon ? <Icon name={icon} size={12} color={c.fg} /> : null}
      <Text variant="caption" weight="semibold" color={c.fg} numberOfLines={1}>
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
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  md: { paddingHorizontal: 10, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
