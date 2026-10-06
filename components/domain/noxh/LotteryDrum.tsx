import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, semantic, sizes, toneColors } from '@/theme';

/** Các bi trong lồng (toạ độ trên khung 100×100). */
const BALLS: { cx: number; cy: number; color: string }[] = [
  { cx: 38, cy: 40, color: colors.primary[500] },
  { cx: 60, cy: 36, color: toneColors.success.solid },
  { cx: 50, cy: 56, color: toneColors.warning.solid },
  { cx: 34, cy: 62, color: toneColors.info.solid },
  { cx: 66, cy: 60, color: toneColors.danger.solid },
  { cx: 50, cy: 28, color: colors.primary[700] },
];
const SPOKES = [0, 45, 90, 135];
const ROTATION_MS = 900;

/** Lồng cầu bốc thăm (SVG) — xoay khi đang bốc thăm; giảm chuyển động → đứng yên. Chỉ trang trí. */
export function LotteryDrum({ spinning }: { spinning: boolean }) {
  const { isWide } = useBreakpoint();
  const reduceMotion = useReducedMotion();
  const size = isWide ? sizes.lotteryDrum.wide : sizes.lotteryDrum.mobile;
  const angle = useSharedValue(0);

  useEffect(() => {
    if (spinning && !reduceMotion) {
      angle.value = 0;
      angle.value = withRepeat(withTiming(360, { duration: ROTATION_MS, easing: Easing.linear }), -1);
    } else {
      cancelAnimation(angle);
      angle.value = withTiming(0, { duration: 0 });
    }
  }, [spinning, reduceMotion, angle]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]} aria-hidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx={50} cy={50} r={46} fill={colors.primary[50]} stroke={colors.primary[700]} strokeWidth={3} />
          {SPOKES.map((deg) => {
            const r = (deg * Math.PI) / 180;
            return (
              <Line
                key={deg}
                x1={50 - 46 * Math.cos(r)}
                y1={50 - 46 * Math.sin(r)}
                x2={50 + 46 * Math.cos(r)}
                y2={50 + 46 * Math.sin(r)}
                stroke={colors.primary[200]}
                strokeWidth={1.5}
              />
            );
          })}
          {BALLS.map((b, i) => (
            <Circle key={i} cx={b.cx} cy={b.cy} r={7} fill={b.color} stroke={semantic.surface} strokeWidth={1.5} />
          ))}
          <Circle cx={50} cy={50} r={5} fill={semantic.inverse} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
});
