import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import {
  fontSizes,
  resolveFontFamily,
  semantic,
  textVariants,
  type FontRole,
  type FontWeight,
  type TextVariant,
} from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Ghi đè độ đậm của variant. */
  weight?: FontWeight;
  /** Ghi đè font: `heading` (Be Vietnam Pro) hoặc `body` (Noto Sans). */
  font?: FontRole;
  color?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/** Text dùng cặp font tiếng Việt và thang chữ của design system. Giữ `allowFontScaling` mặc định. */
export function Text({ variant = 'body', weight, font, color = semantic.text, align, style, ...rest }: TextProps) {
  const preset = textVariants[variant];
  return (
    <RNText
      {...rest}
      style={[
        fontSizes[preset.size],
        {
          fontFamily: resolveFontFamily(font ?? preset.role, weight ?? preset.weight),
          color,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
