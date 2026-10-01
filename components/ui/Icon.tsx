import { View, type StyleProp, type ViewStyle } from 'react-native';

import { iconStroke, icons, semantic, sizes, type IconName, type IconSize } from '@/theme';

export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  /** Nét đậm hơn — dùng cho trạng thái đang chọn. */
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Có nhãn → icon mang nghĩa và được đọc bởi trình đọc màn hình; không có → icon trang trí, bị ẩn. */
  accessibilityLabel?: string;
}

/** Icon lucide (SVG). Bọc trong View cố định kích thước để căn hàng và gắn ngữ nghĩa trợ năng. */
export function Icon({ name, size = 'md', color = semantic.icon, strong, style, accessibilityLabel }: IconProps) {
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
      <Glyph size={px} color={color} strokeWidth={strong ? iconStroke.strong : iconStroke.regular} />
    </View>
  );
}
