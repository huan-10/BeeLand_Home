import tokens from './tokens.json';

/** Kích thước cố định: icon, control, avatar, vùng chạm tối thiểu 44... */
export const sizes = tokens.sizes;
export const borderWidth = tokens.borderWidth;
export const opacity = tokens.opacity;

export type IconSize = keyof typeof sizes.icon;

