import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { borderWidth, interactive, opacity, radius, semantic, shadows, spacing, type ShadowLevel, type Spacing } from '@/theme';

export interface CardProps extends ViewProps {
  padding?: Spacing;
  shadow?: ShadowLevel;
  bordered?: boolean;
  onPress?: () => void;
  /** Web: khi hover nâng nhẹ thẻ (dịch lên 2px + bóng `md`) — chỉ dùng transform, không đổi bố cục. */
  hoverLift?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

/** Thẻ trắng bo góc 16, viền mảnh + bóng nhẹ (theo mockup). */
export function Card({ padding = 'md', shadow = 'sm', bordered = true, onPress, hoverLift, style, children, ...rest }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const cardStyle = [styles.card, shadows[shadow], { padding: spacing[padding] }, bordered && styles.bordered, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        // Phản hồi nhấn bằng opacity, không scale để không xê dịch bố cục.
        style={({ pressed }) => [cardStyle, interactive, hovered && styles.hover, hovered && hoverLift && styles.lifted, pressed && styles.pressed]}
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
  card: { backgroundColor: semantic.surface, borderRadius: radius.lg },
  bordered: { borderWidth: borderWidth.hairline, borderColor: semantic.borderSubtle },
  // Web: mọi thẻ bấm được đổi viền khi hover; `hoverLift` nâng thêm.
  hover: { borderColor: semantic.borderHover },
  lifted: { ...shadows.md, transform: [{ translateY: -spacing['2xs'] }] },
  pressed: { opacity: opacity.pressed },
});
