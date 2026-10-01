import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { fontSizes, motion, opacity as opacityTokens, radius as radii, semantic, sizes, spacing } from '@/theme';

import { Card } from './Card';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const lineHeight = fontSizes.caption.fontSize;

/** Khối giữ chỗ nhấp nháy khi tải dữ liệu. Tắt nhấp nháy khi người dùng bật giảm chuyển động. */
export function Skeleton({ width = '100%', height = lineHeight, radius = radii.sm, style }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(opacityTokens.skeletonMin);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(1, { duration: motion.skeleton }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityLabel="Đang tải"
      style={[{ width, height, borderRadius: radius, backgroundColor: semantic.border }, animatedStyle, style]}
    />
  );
}

/** Thẻ skeleton dựng sẵn cho danh sách. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <View style={styles.row}>
        <Skeleton width={sizes.iconBox.lg} height={sizes.iconBox.lg} radius={radii.full} />
        <View style={styles.col}>
          <Skeleton width="60%" />
          <Skeleton width="40%" height={fontSizes.label.fontSize} />
        </View>
      </View>
      {Array.from({ length: Math.max(lines - 2, 0) }).map((_, i) => (
        <Skeleton key={i} height={fontSizes.label.fontSize} width={i % 2 ? '70%' : '90%'} style={styles.line} />
      ))}
    </Card>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Đang tải danh sách" aria-busy>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  col: { flex: 1, gap: spacing.sm },
  line: { marginTop: spacing.ms },
  list: { gap: spacing.ms },
});
