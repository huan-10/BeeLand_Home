import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { hitSlop, interactive, opacity, semantic, type TextVariant } from '@/theme';

import { Text } from './Text';

export interface TextLinkProps {
  label: string;
  onPress: () => void;
  variant?: TextVariant;
  style?: StyleProp<ViewStyle>;
}

/** Liên kết dạng chữ màu cam (primary-700, đạt 4.95:1), có hitSlop để đủ vùng chạm. */
export function TextLink({ label, onPress, variant = 'smallMedium', style }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={hitSlop}
      style={({ pressed }) => [interactive, pressed && { opacity: opacity.pressed }, style]}>
      <Text variant={variant} weight="semibold" color={semantic.textBrand}>
        {label}
      </Text>
    </Pressable>
  );
}
