import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, interactive, radius, semantic, sizes, type IconName } from '@/theme';

import { Icon } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  /** Bắt buộc: tên truy cập cho nút chỉ có icon. */
  accessibilityLabel: string;
  onPress: () => void;
  /**
   * Hiển thị chấm đỏ góc trên. Màu không phải tín hiệu duy nhất: `dotLabel` được ghép vào
   * tên truy cập (ví dụ "Thông báo, 2 thông báo chưa đọc").
   */
  dot?: boolean;
  dotLabel?: string;
}

/** Nút vuông 44×44 chỉ có icon, viền mảnh; hover/nhấn đổi nền. */
export function IconButton({ icon, accessibilityLabel, onPress, dot, dotLabel }: IconButtonProps) {
  const [hovered, setHovered] = useState(false);
  const label = dot && dotLabel ? `${accessibilityLabel}, ${dotLabel}` : accessibilityLabel;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, interactive, (hovered || pressed) && styles.active]}>
      <Icon name={icon} size="lg" color={semantic.icon} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.md,
    backgroundColor: semantic.surface,
    borderWidth: borderWidth.hairline,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.gray[100] },
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
