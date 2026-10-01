import Ionicons from '@expo/vector-icons/Ionicons';
import type { StyleProp, TextStyle } from 'react-native';

import { colors, type IconName } from '@/theme';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 20, color = colors.gray[700], style }: IconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
