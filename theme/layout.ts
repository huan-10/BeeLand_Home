import tokens from './tokens.json';

export const breakpoints = tokens.breakpoints;
export const layout = tokens.layout;

/** Thang khoảng cách theo nhịp 4/8 (skill ui-ux-pro-max), thêm `ms` 12 và `ml` 20. */
export const spacing = tokens.spacing;
export type Spacing = keyof typeof spacing;

/** Hàng chip / tab lọc: xuống dòng khi thiếu chỗ, không cuộn ngang (skill: chip collection reflow). */
export const chipRow = { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } as const;

/** Thứ tự lớp hiển thị. */
export const zIndex = tokens.zIndex;
