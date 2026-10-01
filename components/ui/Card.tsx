import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { borderWidth, interactive, opacity, radius, semantic, shadows, spacing, type ShadowLevel, type Spacing } from '@/theme';

export interface CardProps extends ViewProps {
  padding?: Spacing;
  shadow?: ShadowLevel;
  bordered?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

/** Thẻ trắng bo góc 16, viền mảnh + bóng nhẹ (theo mockup). */
export function Card({ padding = 'md', shadow = 'sm', bordered = true, onPress, style, children, ...rest }: CardProps) {
  const cardStyle = [styles.card, shadows[shadow], { padding: spacing[padding] }, bordered && styles.bordered, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        // Phản hồi bằng opacity, không scale để không xê dịch bố cục.
        style={({ pressed }) => [cardStyle, interactive, pressed && styles.pressed]}
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
  pressed: { opacity: opacity.pressed },
});
