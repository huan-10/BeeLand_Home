import { Children, createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useBreakpoint, type Breakpoint } from '@/hooks/useBreakpoint';
import { layout, spacing, type Spacing } from '@/theme';

const GutterContext = createContext<number>(spacing.md);

export interface GridProps {
  children: ReactNode;
  /** Khoảng cách giữa các cột và hàng. */
  gutter?: Spacing;
  style?: StyleProp<ViewStyle>;
}

/**
 * Lưới 12 cột (`layout.gridColumns`). Dùng cùng `<Col span>`.
 * Gutter tạo bằng padding của cột + margin âm của hàng, nên độ rộng cột luôn đúng tỷ lệ.
 */
export function Grid({ children, gutter = 'md', style }: GridProps) {
  const g = spacing[gutter];
  return (
    <GutterContext.Provider value={g}>
      <View style={[styles.row, { marginHorizontal: -g / 2, rowGap: g }, style]}>{Children.toArray(children)}</View>
    </GutterContext.Provider>
  );
}

/** Số cột chiếm theo breakpoint; breakpoint lớn hơn kế thừa giá trị nhỏ hơn nếu bỏ trống. */
export type ColSpan = Partial<Record<Breakpoint, number>> & { mobile: number };

export interface ColProps {
  span: ColSpan;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Col({ span, children, style }: ColProps) {
  const gutter = useContext(GutterContext);
  const { breakpoint } = useBreakpoint();
  const order: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
  // Lấy span của breakpoint hiện tại, hoặc của breakpoint nhỏ hơn gần nhất có khai báo.
  const value =
    order
      .slice(0, order.indexOf(breakpoint) + 1)
      .reverse()
      .map((b) => span[b])
      .find((v): v is number => v !== undefined) ?? span.mobile;
  return <View style={[{ width: `${(value / layout.gridColumns) * 100}%`, paddingHorizontal: gutter / 2 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
