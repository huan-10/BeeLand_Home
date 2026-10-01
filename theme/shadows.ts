import type { ViewStyle } from 'react-native';

/**
 * Đổ bóng nhẹ. Dùng thuộc tính `boxShadow` (được React Native hỗ trợ trên
 * kiến trúc mới và chạy trực tiếp trên web) để hiển thị giống nhau ở mọi nền tảng.
 */
export const shadows = {
  none: {},
  sm: { boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05), 0px 1px 3px rgba(16, 24, 40, 0.06)' },
  md: { boxShadow: '0px 4px 12px rgba(16, 24, 40, 0.08)' },
  lg: { boxShadow: '0px 12px 32px rgba(16, 24, 40, 0.12)' },
} satisfies Record<string, ViewStyle>;

export type ShadowLevel = keyof typeof shadows;
