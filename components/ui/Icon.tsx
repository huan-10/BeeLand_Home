import { View, type StyleProp, type ViewStyle } from 'react-native';

import { iconDuotoneOpacity, iconWeight, icons, semantic, sizes, type IconName, type IconSize, type IconVariant } from '@/theme';

export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  /** Kiểu nét (xem `IconVariant` trong `theme/icons.ts`). */
  variant?: IconVariant;
  /** Tắt nhanh: nét đậm (= `variant="bold"`). */
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Có nhãn → icon mang nghĩa và được đọc bởi trình đọc màn hình; không có → icon trang trí, bị ẩn. */
  accessibilityLabel?: string;
}

/** Icon Phosphor (SVG). Bọc trong View cố định kích thước để căn hàng và gắn ngữ nghĩa trợ năng. */
export function Icon({ name, size = 'md', color = semantic.icon, variant, strong, style, accessibilityLabel }: IconProps) {
  const Glyph = icons[name];
  const px = typeof size === 'number' ? size : sizes.icon[size];
  const decorative = !accessibilityLabel;
  return (
    <View
      style={[{ width: px, height: px }, style]}
      accessible={!decorative}
      role={decorative ? undefined : 'img'}
      aria-label={accessibilityLabel}
      aria-hidden={decorative}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}>
      <Glyph size={px} color={color} weight={iconWeight[variant ?? (strong ? 'bold' : 'line')]} duotoneOpacity={iconDuotoneOpacity} />
    </View>
  );
}
