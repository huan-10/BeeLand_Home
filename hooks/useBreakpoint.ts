import { useWindowDimensions } from 'react-native';

import { breakpoints } from '@/theme';

/** mobile < 768 ≤ tablet < 1024 ≤ desktop < 1280 ≤ wide. */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface BreakpointInfo {
  width: number;
  breakpoint: Breakpoint;
  /** ≥ 768px: dùng sidebar trái thay cho bottom tab. */
  isWide: boolean;
  /** ≥ 1024px. */
  isDesktop: boolean;
}

export function useBreakpoint(): BreakpointInfo {
  const { width } = useWindowDimensions();
  const breakpoint: Breakpoint =
    width >= breakpoints.xl ? 'wide' : width >= breakpoints.lg ? 'desktop' : width >= breakpoints.md ? 'tablet' : 'mobile';
  return {
    width,
    breakpoint,
    isWide: width >= breakpoints.md,
    isDesktop: width >= breakpoints.lg,
  };
}
