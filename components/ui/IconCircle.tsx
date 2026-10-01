import { View } from 'react-native';

import { toneColors, type IconName, type Tone } from '@/theme';

import { Icon } from './Icon';

export interface IconCircleProps {
  name: IconName;
  tone?: Tone;
  size?: number;
}

/** Icon đặt trong ô vuông bo góc có nền nhạt theo sắc thái. */
export function IconCircle({ name, tone = 'primary', size = 44 }: IconCircleProps) {
  const c = toneColors[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={name} size={size * 0.5} color={c.fg} />
    </View>
  );
}
