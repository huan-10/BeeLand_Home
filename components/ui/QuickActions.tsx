import { StyleSheet, View } from 'react-native';

import { useHover } from '@/hooks/useHover';
import { fontSizes, interactive, letterSpacing, radius, semantic, shadows, sizes, spacing, type IconName } from '@/theme';

import { IconCircle } from './IconCircle';
import { Pressable } from './Pressable';
import { Text } from './Text';

export interface QuickAction {
  /** Có thể chứa `\n` để ngắt 2 dòng cân đối ("Bàn giao\ncăn hộ"); tên truy cập bỏ ngắt dòng. */
  label: string;
  icon: IconName;
  onPress: () => void;
}

/**
 * Lưới chức năng nhanh: MỘT thẻ trắng, 4 cột đều nhau (hơn 4 mục thì xuống hàng, không cuộn ngang) — icon tròn pastel + nhãn tối đa 2 dòng.
 * Vùng nhãn luôn cao 2 dòng để icon các cột thẳng hàng; mỗi ô là nút ≥ 44, nhấn / hover nền nhạt.
 * `bare`: bỏ nền / bóng thẻ để đặt trong một thẻ khác. `size="sm"`: icon nhỏ hơn, ô thấp hơn, nhãn cao tự nhiên
 * (không giữ 2 dòng) — lưới nhiều mục như "Quản lý" ở Cá nhân.
 */
export function QuickActions({
  items,
  accessibilityLabel,
  bare,
  size = 'md',
}: {
  items: QuickAction[];
  accessibilityLabel?: string;
  bare?: boolean;
  size?: 'md' | 'sm';
}) {
  return (
    <View style={[styles.grid, !bare && styles.card]} accessibilityLabel={accessibilityLabel}>
      {items.map((a) => (
        <Item key={a.label} action={a} small={size === 'sm'} />
      ))}
    </View>
  );
}

function Item({ action, small }: { action: QuickAction; small: boolean }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label.replace(/\n/g, ' ')}
      {...hoverProps}
      style={({ pressed }) => [styles.item, small && styles.itemSm, interactive, (pressed || hovered) && styles.active]}>
      <IconCircle name={action.icon} tone="primary" size={small ? 'md' : 'lg'} />
      <Text variant="label" weight="medium" align="center" numberOfLines={2} color={semantic.text} style={[styles.label, !small && styles.labelFixed]}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    padding: spacing.sm,
    borderRadius: radius['2xl'],
    backgroundColor: semantic.surface,
    ...shadows.soft,
  },
  // 25%: luôn 4 cột kể cả hàng cuối thiếu mục (không giãn ô lẻ).
  item: {
    width: '25%',
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xl,
  },
  itemSm: { gap: spacing.xs, paddingVertical: spacing.sm },
  active: { backgroundColor: semantic.surfaceSunken },
  label: { letterSpacing: letterSpacing.normal },
  // 2 dòng cố định (cỡ md): icon các cột luôn thẳng hàng dù nhãn 1 hay 2 dòng.
  labelFixed: { minHeight: (fontSizes.label.lineHeight ?? 0) * 2 },
});
