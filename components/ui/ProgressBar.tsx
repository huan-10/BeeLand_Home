import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, toneColors, type Tone } from '@/theme';

export interface ProgressBarProps {
  /** 0 – 100. */
  value: number;
  tone?: Tone;
  size?: keyof typeof sizes.progress;
  trackColor?: string;
  accessibilityLabel?: string;
}

/** Thanh tiến độ bo tròn (theo mockup). */
export function ProgressBar({ value, tone = 'primary', size = 'md', trackColor = colors.gray[100], accessibilityLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[styles.track, { height: sizes.progress[size], backgroundColor: trackColor }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: toneColors[tone].solid }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});
