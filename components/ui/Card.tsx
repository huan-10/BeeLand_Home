import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, shadows, type ShadowLevel } from '@/theme';

export interface CardProps extends ViewProps {
  padding?: number;
  shadow?: ShadowLevel;
  bordered?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export function Card({ padding = 16, shadow = 'sm', bordered = true, onPress, style, children, ...rest }: CardProps) {
  const cardStyle = [styles.card, shadows[shadow], { padding }, bordered && styles.bordered, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
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
  card: { backgroundColor: colors.surface, borderRadius: radius.lg },
  bordered: { borderWidth: 1, borderColor: colors.gray[100] },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
});
