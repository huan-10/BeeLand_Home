import tokens from './tokens.json';

/**
 * Bảng màu của BeeSky. Nguồn duy nhất là `tokens.json`, được dùng chung
 * với `tailwind.config.js` để className và style inline luôn đồng bộ.
 */
export const colors = tokens.colors;

export type ColorScale = typeof colors.primary;
export type Tone = 'primary' | 'success' | 'info' | 'danger' | 'warning' | 'neutral';

/** Cặp màu nền/chữ dùng cho các thành phần mang sắc thái (Badge, icon tròn...). */
export const toneColors: Record<Tone, { bg: string; fg: string; solid: string }> = {
  primary: { bg: colors.primary[50], fg: colors.primary[700], solid: colors.primary[500] },
  success: { bg: colors.success[50], fg: colors.success[700], solid: colors.success[500] },
  info: { bg: colors.info[50], fg: colors.info[700], solid: colors.info[500] },
  danger: { bg: colors.danger[50], fg: colors.danger[700], solid: colors.danger[500] },
  warning: { bg: colors.warning[50], fg: colors.warning[700], solid: colors.warning[500] },
  neutral: { bg: colors.gray[100], fg: colors.gray[700], solid: colors.gray[500] },
};
