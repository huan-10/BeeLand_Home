import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { interactive, motion, opacity, radius as radii, semantic, shadows, spacing, type ShadowLevel, type Spacing } from '@/theme';

export type CardVariant = 'elevated' | 'outlined' | 'sunken';

export interface CardProps extends ViewProps {
  padding?: Spacing;
  /**
   * - `elevated` (mặc định): thẻ trắng, bóng `soft`, không viền — đặt trên nền màn hình.
   * - `outlined`: thẻ trắng viền mảnh, không bóng — đặt lồng trong vùng trắng khác.
   * - `sunken`: khối nền cát nhạt, không bóng — nhóm số liệu bên trong thẻ.
   */
  variant?: CardVariant;
  /** Bo góc: `2xl` 24 (mặc định, thẻ ở màn chính), `3xl` 28 (thẻ nổi bật), `lg` 16 (khối lồng). */
  radius?: '3xl' | '2xl' | 'xl' | 'lg';
  /** Ghi đè bóng của thẻ `elevated` (vd `raised` cho thẻ form nổi trên ảnh). */
  shadow?: ShadowLevel;
  onPress?: () => void;
  /** Web: khi hover nâng nhẹ thẻ (dịch lên 4px) — chỉ dùng transform, không đổi bố cục. */
  hoverLift?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

/** Thẻ bo tròn lớn, bóng nhẹ thay cho viền. Thẻ bấm được: hover đậm bóng (`raised`), nhấn giảm opacity. */
export function Card({ padding = 'md', variant = 'elevated', radius = '2xl', shadow, onPress, hoverLift, style, children, ...rest }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const cardStyle = [styles.card, styles[variant], shadow && variant === 'elevated' && shadows[shadow], { padding: spacing[padding], borderRadius: radii[radius] }, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        // Phản hồi nhấn bằng opacity, không scale để không xê dịch bố cục.
        style={({ pressed }) => [cardStyle, interactive, hovered && hoverStyle[variant], hovered && hoverLift && styles.lifted, pressed && styles.pressed]}
        {...rest}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: semantic.surface, transitionDuration: `${motion.fast}ms` },
  elevated: shadows.soft,
  outlined: { borderWidth: StyleSheet.hairlineWidth, borderColor: semantic.border },
  sunken: { backgroundColor: semantic.surfaceSunken },
  lifted: { transform: [{ translateY: -spacing.xs }] },
  pressed: { opacity: opacity.pressed },
});

const hoverStyle = StyleSheet.create({
  elevated: shadows.raised,
  outlined: { borderColor: semantic.borderHover, backgroundColor: semantic.surfaceMuted },
  sunken: { backgroundColor: semantic.border },
});
