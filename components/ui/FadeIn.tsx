import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { motion } from '@/theme';

export interface FadeInProps {
  children: ReactNode;
  /** Thứ tự xuất hiện (mỗi bậc trễ thêm `motion.stagger`). */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Hiệu ứng xuất hiện nhẹ (mờ dần + trượt lên). Tự tắt khi người dùng bật giảm chuyển động
 * (`ReduceMotion.System` — native và `prefers-reduced-motion` trên web).
 */
export function FadeIn({ children, index = 0, style }: FadeInProps) {
  return (
    <Animated.View
      style={style}
      entering={FadeInDown.duration(motion.enter)
        .delay(index * motion.stagger)
        .reduceMotion(ReduceMotion.System)}>
      {children}
    </Animated.View>
  );
}
