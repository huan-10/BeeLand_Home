import type { TextStyle } from 'react-native';

import tokens from './tokens.json';

/**
 * Cặp font hỗ trợ đầy đủ dấu tiếng Việt (skill ui-ux-pro-max, "Vietnamese Friendly"):
 * Be Vietnam Pro cho tiêu đề, Noto Sans cho nội dung.
 */
export const fontFamily = tokens.fontFamily;
export type FontRole = keyof typeof fontFamily;
export type FontWeight = keyof typeof fontFamily.body;

export const letterSpacing = tokens.letterSpacing;

export type FontSize = keyof typeof tokens.fontSize;

/** Thang kích thước chữ: [fontSize, lineHeight]. */
export const fontSizes = Object.fromEntries(
  Object.entries(tokens.fontSize).map(([key, [size, lineHeight]]) => [key, { fontSize: size, lineHeight }]),
) as Record<FontSize, Pick<TextStyle, 'fontSize' | 'lineHeight'>>;

/** Chọn font theo vai trò + độ đậm (tiêu đề chỉ có semibold/bold). */
export function resolveFontFamily(role: FontRole, weight: FontWeight): string {
  if (role === 'heading') return weight === 'bold' ? fontFamily.heading.bold : fontFamily.heading.semibold;
  return fontFamily.body[weight];
}

/** Các kiểu chữ dựng sẵn dùng trong toàn ứng dụng. */
export const textVariants = {
  display: { size: '3xl', weight: 'bold', role: 'heading' },
  h1: { size: '2xl', weight: 'bold', role: 'heading' },
  h2: { size: 'xl', weight: 'semibold', role: 'heading' },
  h3: { size: 'lg', weight: 'semibold', role: 'heading' },
  body: { size: 'base', weight: 'regular', role: 'body' },
  bodyMedium: { size: 'base', weight: 'medium', role: 'body' },
  small: { size: 'sm', weight: 'regular', role: 'body' },
  smallMedium: { size: 'sm', weight: 'medium', role: 'body' },
  caption: { size: 'xs', weight: 'regular', role: 'body' },
  label: { size: 'sm', weight: 'semibold', role: 'body' },
  overline: { size: 'xs', weight: 'semibold', role: 'body' },
} satisfies Record<string, { size: FontSize; weight: FontWeight; role: FontRole }>;

export type TextVariant = keyof typeof textVariants;
