import tokens from './tokens.json';

export const breakpoints = tokens.breakpoints;
export const layout = tokens.layout;

/** Khoảng cách theo bội số 4px. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;
