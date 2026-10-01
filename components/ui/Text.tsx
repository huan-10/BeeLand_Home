import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import {
  fontSizes,
  letterSpacing,
  numericText,
  resolveFontFamily,
  semantic,
  textVariants,
  type FontWeight,
  type TextVariant,
} from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Ghi đè độ đậm của variant. */
  weight?: FontWeight;
  /** Chữ số đều độ rộng (số tiền, ngày, mã) để cột số thẳng hàng. */
  numeric?: boolean;
  color?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/** Text dùng Be Vietnam Pro và thang chữ của design system. Giữ `allowFontScaling` mặc định. */
export function Text({ variant = 'body', weight, numeric, color = semantic.text, align, style, ...rest }: TextProps) {
  const preset: { size: keyof typeof fontSizes; weight: FontWeight; tracking?: keyof typeof letterSpacing } = textVariants[variant];
  return (
    <RNText
      {...rest}
      style={[
        fontSizes[preset.size],
        {
          fontFamily: resolveFontFamily(weight ?? preset.weight),
          letterSpacing: preset.tracking ? letterSpacing[preset.tracking] : undefined,
          color,
          textAlign: align,
        },
        numeric && numericText,
        style,
      ]}
    />
  );
}
