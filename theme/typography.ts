import type { TextStyle } from 'react-native';

import tokens from './tokens.json';

export const fontFamily = tokens.fontFamily;
export type FontWeight = keyof typeof fontFamily;

export type FontSize = keyof typeof tokens.fontSize;

/** Thang kích thước chữ: [fontSize, lineHeight]. */
export const fontSizes = Object.fromEntries(
  Object.entries(tokens.fontSize).map(([key, [size, lineHeight]]) => [key, { fontSize: size, lineHeight }]),
) as Record<FontSize, Pick<TextStyle, 'fontSize' | 'lineHeight'>>;

/** Các kiểu chữ dựng sẵn dùng trong toàn ứng dụng. */
export const textVariants = {
  display: { size: '3xl', weight: 'bold' },
  h1: { size: '2xl', weight: 'bold' },
  h2: { size: 'xl', weight: 'semibold' },
  h3: { size: 'lg', weight: 'semibold' },
  body: { size: 'base', weight: 'regular' },
  bodyMedium: { size: 'base', weight: 'medium' },
  small: { size: 'sm', weight: 'regular' },
  smallMedium: { size: 'sm', weight: 'medium' },
  caption: { size: 'xs', weight: 'regular' },
  label: { size: 'sm', weight: 'semibold' },
} satisfies Record<string, { size: FontSize; weight: FontWeight }>;

export type TextVariant = keyof typeof textVariants;
