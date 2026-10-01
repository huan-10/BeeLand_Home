import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes, spacing } from '@/theme';

import { useBreakpoint } from './useBreakpoint';

/** Khoảng cách từ mép dưới màn hình tới thanh tab nổi. */
export function floatingTabBarBottom(insetBottom: number): number {
  return Math.max(insetBottom, spacing.ms);
}

/**
 * Chiều cao cần chừa ở đáy để thanh tab kính nổi (mobile) không che nội dung cuối trang.
 * Bằng 0 ngoài nhóm tab (màn xác thực) và trên màn rộng (điều hướng là sidebar).
 */
export function useFloatingTabBarSpace(): number {
  const inTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const { isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  if (!inTabs || isWide) return 0;
  return sizes.tabBar.height + floatingTabBarBottom(insets.bottom) + spacing.ms;
}
