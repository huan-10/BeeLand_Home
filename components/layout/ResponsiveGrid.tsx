import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { spacing } from '@/theme';

export interface ResponsiveGridProps {
  children: ReactNode;
  /** Số cột trên màn hình rộng (≥768px). Mobile luôn 1 cột. */
  columns?: number;
  gap?: number;
}

/** Lưới đơn giản: chia phần tử thành từng hàng, mỗi ô `flex: 1`. */
export function ResponsiveGrid({ children, columns = 2, gap = spacing.ms }: ResponsiveGridProps) {
  const { isWide } = useBreakpoint();
  const cols = isWide ? columns : 1;
  const items = Children.toArray(children);

  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));

  return (
    <View style={{ gap }}>
      {rows.map((row, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {row.map((child, c) => (
            <View key={c} style={styles.cell}>
              {child}
            </View>
          ))}
          {Array.from({ length: cols - row.length }).map((_, c) => (
            <View key={`pad-${c}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  cell: { flex: 1, minWidth: 0 },
});
