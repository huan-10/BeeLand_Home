import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useHover } from '@/hooks/useHover';
import { interactive, opacity, semantic, sizes, type TextVariant } from '@/theme';

import { Text } from './Text';

export interface TextLinkProps {
  label: string;
  onPress: () => void;
  variant?: TextVariant;
  style?: StyleProp<ViewStyle>;
}

/** Liên kết dạng chữ cam đậm (primary-700, 5.4:1); vùng chạm cao ≥ 44; hover gạch chân. */
export function TextLink({ label, onPress, variant = 'captionStrong', style }: TextLinkProps) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      {...hoverProps}
      style={({ pressed }) => [styles.link, interactive, pressed && styles.pressed, style]}>
      <Text variant={variant} weight="semibold" color={semantic.textBrand} style={hovered && styles.underline}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: sizes.touchTarget, justifyContent: 'center' },
  pressed: { opacity: opacity.pressed },
  underline: { textDecorationLine: 'underline' },
});
