import { useWindowDimensions } from 'react-native';

import { breakpoints } from '@/theme';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointInfo {
  width: number;
  breakpoint: Breakpoint;
  /** ≥ 768px: dùng sidebar trái thay cho bottom tab. */
  isWide: boolean;
  isDesktop: boolean;
}

export function useBreakpoint(): BreakpointInfo {
  const { width } = useWindowDimensions();
  const breakpoint: Breakpoint =
    width >= breakpoints.lg ? 'desktop' : width >= breakpoints.md ? 'tablet' : 'mobile';
  return {
    width,
    breakpoint,
    isWide: width >= breakpoints.md,
    isDesktop: breakpoint === 'desktop',
  };
}
