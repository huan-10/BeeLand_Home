import { Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, interactive, opacity, radius, semantic, sizes, spacing } from '@/theme';

import { useHover } from '@/hooks/useHover';

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

/** Nút lọc dạng viên thuốc; cao tối thiểu 44 (vùng chạm). Web: hover viền cam. */
export function Chip({ label, selected, onPress, count, role = 'button', accessibilityLabel }: ChipProps) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      aria-selected={!!selected}
      {...hoverProps}
      style={({ pressed }) => [
        styles.chip,
        interactive,
        selected ? styles.selected : styles.idle,
        hovered && (selected ? styles.selectedHover : styles.idleHover),
        pressed && styles.pressed,
      ]}>
      <Text variant="smallMedium" weight={selected ? 'semibold' : 'medium'} color={selected ? semantic.textOnBrand : semantic.textSecondary}>
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
  idleHover: { borderColor: semantic.brand, backgroundColor: colors.primary[50] },
  selectedHover: { backgroundColor: semantic.brandPressed, borderColor: semantic.brandPressed },
  pressed: { opacity: opacity.pressed },
});
