import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, fontFamily, fontSizes, textVariants, type FontWeight, type TextVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Ghi đè độ đậm của variant. */
  weight?: FontWeight;
  color?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/** Text dùng font Inter và thang chữ của design system. */
export function Text({ variant = 'body', weight, color = colors.gray[900], align, style, ...rest }: TextProps) {
  const preset = textVariants[variant];
  return (
    <RNText
      {...rest}
      style={[
        fontSizes[preset.size],
        { fontFamily: fontFamily[weight ?? preset.weight], color, textAlign: align },
        style,
      ]}
    />
  );
}
