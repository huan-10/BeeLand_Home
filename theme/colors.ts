import tokens from './tokens.json';

/**
 * Bảng màu BeeSky (theo mockup). Nguồn duy nhất là `tokens.json`,
 * dùng chung với `tailwind.config.js` để className và style luôn đồng bộ.
 */
export const colors = tokens.colors;

export type ColorScale = typeof colors.primary;
export type Tone = 'primary' | 'success' | 'info' | 'danger' | 'warning' | 'neutral';

/**
 * Màu theo vai trò. Component dùng các token này thay vì chọn trực tiếp từ thang màu.
 * Lưu ý tương phản (WCAG): chữ cam luôn dùng `textBrand` (primary-700, 4.95:1 trên nền trắng),
 * chữ phụ dùng `textMuted` (gray-500, 4.83:1). gray-400 chỉ dùng cho icon trang trí.
 */
export const semantic = {
  bg: colors.background,
  surface: colors.surface,
  surfaceMuted: colors.gray[50],
  border: colors.gray[200],
  borderSubtle: colors.gray[100],
  text: colors.gray[900],
  textSecondary: colors.gray[700],
  textMuted: colors.gray[500],
  textBrand: colors.primary[700],
  textSuccess: colors.success[700],
  textOnPrimary: colors.white,
  iconMuted: colors.gray[400],
  icon: colors.gray[700],
  brand: colors.primary[500],
  brandPressed: colors.primary[600],
  focusRing: colors.primary[500],
  focusHalo: colors.primary[100],
} as const;

/** Cặp nền pastel / chữ đậm cho Badge, icon tròn... (đều đạt ≥4.5:1). */
export const toneColors: Record<Tone, { bg: string; fg: string; solid: string; border: string }> = {
  primary: { bg: colors.primary[50], fg: colors.primary[700], solid: colors.primary[500], border: colors.primary[100] },
  success: { bg: colors.success[50], fg: colors.success[700], solid: colors.success[500], border: colors.success[100] },
  info: { bg: colors.info[50], fg: colors.info[700], solid: colors.info[500], border: colors.info[100] },
  danger: { bg: colors.danger[50], fg: colors.danger[700], solid: colors.danger[500], border: colors.danger[100] },
  warning: { bg: colors.warning[50], fg: colors.warning[700], solid: colors.warning[500], border: colors.warning[100] },
  neutral: { bg: colors.gray[100], fg: colors.gray[700], solid: colors.gray[500], border: colors.gray[200] },
};
