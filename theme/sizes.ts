import tokens from './tokens.json';

/** Kích thước cố định: icon, control, avatar, vùng chạm tối thiểu 44... */
export const sizes = tokens.sizes;
export const borderWidth = tokens.borderWidth;
export const opacity = tokens.opacity;

export type IconSize = keyof typeof sizes.icon;

/** Mở rộng vùng chạm cho phần tử nhỏ để đạt tối thiểu 44×44. */
export const hitSlop = {
  top: sizes.hitSlop,
  bottom: sizes.hitSlop,
  left: sizes.hitSlop,
  right: sizes.hitSlop,
};
