import type { ViewStyle } from 'react-native';

import { colors } from './colors';

/**
 * Đổ bóng nhẹ (theo mockup: thẻ trắng nổi nhẹ trên nền xám sáng).
 * Dùng `boxShadow` (React Native kiến trúc mới + web) để hiển thị giống nhau mọi nền tảng.
 */
export const shadows = {
  none: {},
  sm: { boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05), 0px 1px 3px rgba(16, 24, 40, 0.06)' },
  md: { boxShadow: '0px 4px 12px rgba(16, 24, 40, 0.08)' },
  lg: { boxShadow: '0px 12px 32px rgba(16, 24, 40, 0.12)' },
  navTop: { boxShadow: '0px -2px 12px rgba(16, 24, 40, 0.04)' },
  /** Vòng sáng quanh ô nhập khi focus. */
  focusHalo: { boxShadow: `0px 0px 0px 3px ${colors.primary[100]}` },
} satisfies Record<string, ViewStyle>;

export type ShadowLevel = keyof typeof shadows;
