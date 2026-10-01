import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, radius as radii } from '@/theme';

import { Card } from './Card';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Khối giữ chỗ nhấp nháy khi đang tải dữ liệu. */
export function Skeleton({ width = '100%', height = 16, radius = radii.sm, style }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityLabel="Đang tải"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.gray[200] }, animatedStyle, style]}
    />
  );
}

/** Thẻ skeleton dựng sẵn cho danh sách. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={radii.md} />
        <View style={styles.col}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      {Array.from({ length: Math.max(lines - 2, 0) }).map((_, i) => (
        <Skeleton key={i} height={12} width={i % 2 ? '70%' : '90%'} style={styles.line} />
      ))}
    </Card>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  col: { flex: 1, gap: 8 },
  line: { marginTop: 12 },
  list: { gap: 12 },
});
