import tokens from './tokens.json';

export const breakpoints = tokens.breakpoints;
export const layout = tokens.layout;

/** Thang khoảng cách theo nhịp 4/8 (skill ui-ux-pro-max), thêm `ms` 12 và `ml` 20. */
export const spacing = tokens.spacing;
export type Spacing = keyof typeof spacing;

/** Hàng chip lọc cuộn ngang. */
export const chipRow = { gap: spacing.sm, paddingVertical: spacing['2xs'] };
