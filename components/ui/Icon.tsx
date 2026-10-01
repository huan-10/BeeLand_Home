import Ionicons from '@expo/vector-icons/Ionicons';
import type { StyleProp, TextStyle } from 'react-native';

import { semantic, sizes, type IconName, type IconSize } from '@/theme';

export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  style?: StyleProp<TextStyle>;
  /** Có nhãn → icon mang nghĩa và được đọc bởi trình đọc màn hình; không có → icon trang trí, bị ẩn. */
  accessibilityLabel?: string;
}

export function Icon({ name, size = 'md', color = semantic.icon, style, accessibilityLabel }: IconProps) {
  const decorative = !accessibilityLabel;
  return (
    <Ionicons
      name={name}
      size={typeof size === 'number' ? size : sizes.icon[size]}
      color={color}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      aria-hidden={decorative}
    />
  );
}
