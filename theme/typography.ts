import type { TextStyle } from 'react-native';

import tokens from './tokens.json';

/**
 * Một họ font duy nhất: Be Vietnam Pro (thiết kế cho tiếng Việt, dấu rõ) với 4 độ đậm.
 * React Native không tự chọn file font theo `fontWeight` với font tuỳ chỉnh → mỗi độ đậm là một fontFamily.
 */
export const fontFamily = tokens.fontFamily;
export type FontWeight = keyof typeof fontFamily;

export const letterSpacing = tokens.letterSpacing;

export type FontSize = keyof typeof tokens.fontSize;

/** Thang cỡ chữ: [fontSize, lineHeight] — display 28 · title 22 · heading 17 · body 15 · caption 14 · label 12. */
export const fontSizes = Object.fromEntries(
  Object.entries(tokens.fontSize).map(([key, [size, lineHeight]]) => [key, { fontSize: size, lineHeight }]),
) as Record<FontSize, Pick<TextStyle, 'fontSize' | 'lineHeight'>>;

export function resolveFontFamily(weight: FontWeight): string {
  return fontFamily[weight];
}

type VariantSpec = { size: FontSize; weight: FontWeight; tracking?: keyof typeof letterSpacing };

/**
 * Kiểu chữ dựng sẵn.
 * - `display` số tiền lớn · `title` tiêu đề màn / khối lớn · `heading` tiêu đề thẻ, mục
 * - `subhead` dòng nhấn mạnh 15 đậm · `body` nội dung · `bodyStrong` giá trị 15 vừa
 * - `caption` thông tin phụ 14 · `captionStrong` nhãn phụ 14 vừa · `label` nhãn nhỏ nhất 12 đậm, giãn chữ
 */
export const textVariants = {
  display: { size: 'display', weight: 'bold', tracking: 'tight' },
  title: { size: 'title', weight: 'bold', tracking: 'tight' },
  heading: { size: 'heading', weight: 'semibold' },
  subhead: { size: 'body', weight: 'semibold' },
  body: { size: 'body', weight: 'regular' },
  bodyStrong: { size: 'body', weight: 'medium' },
  caption: { size: 'caption', weight: 'regular' },
  captionStrong: { size: 'caption', weight: 'medium' },
  label: { size: 'label', weight: 'semibold', tracking: 'label' },
} satisfies Record<string, VariantSpec>;

export type TextVariant = keyof typeof textVariants;

/** Chữ số đều độ rộng cho số tiền, ngày, mã — cột số thẳng hàng. */
export const numericText: TextStyle = { fontVariant: ['tabular-nums'] };
