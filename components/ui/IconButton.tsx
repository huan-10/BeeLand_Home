import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, interactive, radius, semantic, shadows, sizes, type IconName } from '@/theme';

import { useHover } from '@/hooks/useHover';

import { Icon } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  /** Bắt buộc: tên truy cập cho nút chỉ có icon. */
  accessibilityLabel: string;
  onPress: () => void;
  /**
   * - `soft` (mặc định): nút tròn trắng bóng nhẹ, đặt trên nền màn hình.
   * - `plain`: nút tròn trong suốt, đặt bên trong thẻ trắng.
   */
  variant?: 'soft' | 'plain';
  /**
   * Hiển thị chấm đỏ góc trên. Màu không phải tín hiệu duy nhất: `dotLabel` được ghép vào
   * tên truy cập (ví dụ "Thông báo, 2 thông báo chưa đọc").
   */
  dot?: boolean;
  dotLabel?: string;
}

/** Nút tròn 44×44 chỉ có icon; hover/nhấn đổi nền. */
export function IconButton({ icon, accessibilityLabel, onPress, variant = 'soft', dot, dotLabel }: IconButtonProps) {
  const { hovered, hoverProps } = useHover();
  const label = dot && dotLabel ? `${accessibilityLabel}, ${dotLabel}` : accessibilityLabel;
  return (
    <Pressable
      onPress={onPress}
      {...hoverProps}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, styles[variant], interactive, (hovered || pressed) && styles.active]}>
      <Icon name={icon} size="md" color={semantic.icon} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soft: { backgroundColor: semantic.surface, ...shadows.soft },
  plain: { backgroundColor: colors.transparent },
  active: { backgroundColor: semantic.surfaceSunken },
  dot: {
    position: 'absolute',
    top: sizes.dot.md,
    right: sizes.dot.md,
    width: sizes.dot.md + borderWidth.strong * 2,
    height: sizes.dot.md + borderWidth.strong * 2,
    borderRadius: radius.full,
    backgroundColor: colors.danger[600],
    borderWidth: borderWidth.strong,
    borderColor: semantic.surface,
  },
});
