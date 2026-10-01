import type { ViewStyle } from 'react-native';

import { semantic } from './colors';

/**
 * Bóng 4 mức, màu bóng nâu ấm (ink) thay vì đen xanh. Thẻ dùng bóng thay cho viền.
 * Dùng `boxShadow` (React Native kiến trúc mới + web) để giống nhau mọi nền tảng.
 * - `soft`: thẻ trên nền màn hình
 * - `raised`: thẻ khi hover / nâng lên; `raisedTop`: thanh hành động dính đáy (bóng hắt lên)
 * - `overlay`: toast, thanh tab nổi, menu
 * - `modal`: hộp thoại
 */
export const shadows = {
  none: {},
  soft: { boxShadow: '0px 1px 2px rgba(43, 32, 25, 0.04), 0px 6px 20px rgba(43, 32, 25, 0.06)' },
  raised: { boxShadow: '0px 2px 4px rgba(43, 32, 25, 0.05), 0px 12px 28px rgba(43, 32, 25, 0.10)' },
  raisedTop: { boxShadow: '0px -4px 16px rgba(43, 32, 25, 0.07)' },
  overlay: { boxShadow: '0px 12px 32px rgba(43, 32, 25, 0.16)' },
  modal: { boxShadow: '0px 24px 56px rgba(43, 32, 25, 0.24)' },
  /** Vòng sáng quanh ô nhập khi focus. */
  focusHalo: { boxShadow: `0px 0px 0px 3px ${semantic.focusHalo}` },
} satisfies Record<string, ViewStyle>;

export type ShadowLevel = keyof typeof shadows;
