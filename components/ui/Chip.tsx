import { Pressable, StyleSheet } from 'react-native';

import { borderWidth, interactive, opacity, radius, semantic, sizes, spacing } from '@/theme';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  /** `tab` khi chip là tab lọc (đặt trong vùng `role="tablist"`). */
  role?: 'button' | 'tab';
  /** Tên truy cập đầy đủ, ví dụ "Đang hiệu lực, 2 hợp đồng". */
  accessibilityLabel?: string;
}

/** Nút lọc dạng viên thuốc; cao tối thiểu 40 + hitSlop để đạt vùng chạm 44. */
export function Chip({ label, selected, onPress, count, role = 'button', accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      hitSlop={{ top: spacing['2xs'], bottom: spacing['2xs'] }}
      style={({ pressed }) => [styles.chip, interactive, selected ? styles.selected : styles.idle, pressed && styles.pressed]}>
      <Text variant="smallMedium" weight={selected ? 'semibold' : 'medium'} color={selected ? semantic.textOnPrimary : semantic.textSecondary}>
        {count !== undefined ? `${label} (${count})` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: sizes.control.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: borderWidth.hairline,
  },
  idle: { backgroundColor: semantic.surface, borderColor: semantic.border },
  selected: { backgroundColor: semantic.brand, borderColor: semantic.brand },
  pressed: { opacity: opacity.pressed },
});
