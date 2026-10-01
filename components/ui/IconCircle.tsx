import { StyleSheet, View } from 'react-native';

import { radius, sizes, toneColors, type IconName, type Tone } from '@/theme';

import { Icon } from './Icon';

export interface IconCircleProps {
  name: IconName;
  tone?: Tone;
  size?: keyof typeof sizes.iconBox;
}

const iconForBox: Record<keyof typeof sizes.iconBox, keyof typeof sizes.icon> = {
  sm: 'sm',
  md: 'md',
  lg: 'md',
  xl: 'lg',
  hero: 'xl',
};

/** Icon trong ô tròn nền pastel theo sắc thái. */
export function IconCircle({ name, tone = 'primary', size = 'lg' }: IconCircleProps) {
  const c = toneColors[tone];
  const box = sizes.iconBox[size];
  return (
    <View style={[styles.box, { width: box, height: box, backgroundColor: c.bg }]}>
      <Icon name={name} size={iconForBox[size]} color={c.fg} strong />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
