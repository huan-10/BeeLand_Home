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
 * Tương phản (WCAG AA, đo bằng audit): mọi chữ ≥ 4.5:1.
 * - Chữ cam: `textBrand` (primary-700, 4.95:1 trên trắng).
 * - Chữ mờ: `textMuted` (gray-600, ≥ 7:1 trên trắng và trên nền pastel).
 * - Chữ trên nền cam đặc `brand` (#F08A24): `textOnBrand` (gray-900, 7.07:1) — giữ nguyên màu nền theo mockup.
 * - Chữ trên lớp phủ tối / ảnh / toast: `textInverse` (trắng).
 * - gray-400 chỉ dùng cho icon trang trí, không dùng cho chữ.
 */
export const semantic = {
  bg: colors.background,
  surface: colors.surface,
  surfaceMuted: colors.gray[50],
  border: colors.gray[200],
  borderHover: colors.primary[200],
  borderSubtle: colors.gray[100],
  text: colors.gray[900],
  textSecondary: colors.gray[700],
  textMuted: colors.gray[600],
  placeholder: colors.gray[500],
  textBrand: colors.primary[700],
  textSuccess: colors.success[700],
  textOnBrand: colors.gray[900],
  textInverse: colors.white,
  iconMuted: colors.gray[400],
  icon: colors.gray[700],
  brand: colors.primary[500],
  brandPressed: colors.primary[600],
  focusRing: colors.primary[500],
  focusHalo: colors.primary[100],
} as const;

/**
 * Cặp nền pastel / chữ đậm cho Badge, icon tròn... (chữ ≥ 4.5:1).
 * `onSolid`: màu icon/chữ đặt trên nền `solid` (≥ 3:1 cho icon).
 */
export const toneColors: Record<Tone, { bg: string; fg: string; solid: string; border: string; onSolid: string }> = {
  primary: { bg: colors.primary[50], fg: colors.primary[700], solid: colors.primary[500], border: colors.primary[100], onSolid: colors.gray[900] },
  success: { bg: colors.success[50], fg: colors.success[700], solid: colors.success[500], border: colors.success[100], onSolid: colors.white },
  info: { bg: colors.info[50], fg: colors.info[700], solid: colors.info[500], border: colors.info[100], onSolid: colors.white },
  danger: { bg: colors.danger[50], fg: colors.danger[700], solid: colors.danger[500], border: colors.danger[100], onSolid: colors.white },
  warning: { bg: colors.warning[50], fg: colors.warning[700], solid: colors.warning[500], border: colors.warning[100], onSolid: colors.gray[900] },
  neutral: { bg: colors.gray[100], fg: colors.gray[700], solid: colors.gray[500], border: colors.gray[200], onSolid: colors.white },
};
