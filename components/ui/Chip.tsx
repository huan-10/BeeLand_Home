import { StyleSheet, View } from 'react-native';

import { interactive, opacity, radius, semantic, shadows, sizes, spacing } from '@/theme';

import { useHover } from '@/hooks/useHover';

import { Pressable } from './Pressable';
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
  /** `sm`: viên gọn cao 36 (vùng chạm vẫn 44 nhờ hitSlop) — hàng lọc theo mã căn. */
  size?: 'md' | 'sm';
}

/** Bù vùng chạm của chip `sm` lên `sizes.touchTarget`. */
const SM_SLOP = (sizes.touchTarget - sizes.chipCompact) / 2;

/**
 * Nút lọc dạng viên thuốc, cao 44 (vùng chạm); `size="sm"` cao 36.
 * Đang chọn: nền tối `inverse` chữ trắng. Thường: thẻ trắng bóng nhẹ. Số lượng hiển thị trong viên nhỏ.
 */
export function Chip({ label, selected, onPress, count, role = 'button', accessibilityLabel, size = 'md' }: ChipProps) {
  const { hovered, hoverProps } = useHover();
  const fg = selected ? semantic.onInverse : semantic.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? (count !== undefined ? `${label}, ${count}` : label)}
      aria-selected={!!selected}
      hitSlop={size === 'sm' ? { top: SM_SLOP, bottom: SM_SLOP } : undefined}
      {...hoverProps}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' && styles.sm,
        interactive,
        selected ? styles.selected : styles.idle,
        hovered && (selected ? styles.selectedHover : styles.idleHover),
        pressed && styles.pressed,
      ]}>
      <Text variant={size === 'sm' ? 'caption' : 'captionStrong'} weight="semibold" color={fg} numberOfLines={1}>
        {label}
      </Text>
      {count !== undefined ? (
        <View style={[styles.count, selected ? styles.countSelected : styles.countIdle]}>
          <Text variant="label" numeric color={selected ? semantic.onInverse : semantic.textSecondary}>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: sizes.control.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  sm: { minHeight: sizes.chipCompact, paddingHorizontal: spacing.ms },
  idle: { backgroundColor: semantic.surface, ...shadows.soft },
  selected: { backgroundColor: semantic.inverse },
  idleHover: { backgroundColor: semantic.surfaceSunken },
  selectedHover: { backgroundColor: semantic.inverseHover },
  pressed: { opacity: opacity.pressed },
  count: { minWidth: sizes.countBadge + spacing.xs, paddingHorizontal: spacing.xs, borderRadius: radius.full, alignItems: 'center' },
  countIdle: { backgroundColor: semantic.surfaceSunken },
  countSelected: { backgroundColor: semantic.inverseTrack },
});
