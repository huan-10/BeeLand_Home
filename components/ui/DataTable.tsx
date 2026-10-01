import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, interactive, radius, semantic, shadows, sizes, spacing } from '@/theme';

import { Text } from './Text';

export interface DataTableColumn<K extends string> {
  key: K;
  title: string;
  /** Tỷ lệ độ rộng cột (flex-grow). */
  flex: number;
  align?: 'left' | 'right';
}

export interface DataTableRow<K extends string> {
  key: string;
  cells: Record<K, ReactNode>;
  onPress?: () => void;
  /** Mô tả hành động khi bấm dòng, ví dụ "Mở phiếu thu PT2026-0015". */
  accessibilityHint?: string;
}

export interface DataTableProps<K extends string> {
  /** Tên bảng cho trình đọc màn hình. */
  accessibilityLabel: string;
  columns: DataTableColumn<K>[];
  rows: DataTableRow<K>[];
}

/**
 * Bảng dữ liệu cho màn hình rộng: `role="table"` → `row` → `columnheader` / `cell`.
 * Dòng bấm được: hover nền nhạt + con trỏ pointer, focus bằng Tab, Enter để mở.
 * Màn hẹp: dùng danh sách thẻ thay vì bảng (skill: table handling → card layout).
 */
export function DataTable<K extends string>({ accessibilityLabel, columns, rows }: DataTableProps<K>) {
  return (
    <View role="table" aria-label={accessibilityLabel} style={styles.table}>
      <View role="row" style={[styles.row, styles.headerRow]}>
        {columns.map((c) => (
          <View key={c.key} role="columnheader" style={[styles.cell, { flex: c.flex }, c.align === 'right' && styles.right]}>
            <Text variant="label" color={semantic.textMuted} align={c.align ?? 'left'}>
              {c.title}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((r, i) => (
        <TableRow key={r.key} row={r} columns={columns} last={i === rows.length - 1} />
      ))}
    </View>
  );
}

function TableRow<K extends string>({ row, columns, last }: { row: DataTableRow<K>; columns: DataTableColumn<K>[]; last: boolean }) {
  const [hovered, setHovered] = useState(false);
  const cells = columns.map((c) => (
    <View key={c.key} role="cell" style={[styles.cell, { flex: c.flex }, c.align === 'right' && styles.right]}>
      {row.cells[c.key]}
    </View>
  ));
  const rowStyle = [styles.row, !last && styles.divider];
  if (!row.onPress) {
    return (
      <View role="row" style={rowStyle}>
        {cells}
      </View>
    );
  }
  return (
    <Pressable
      role="row"
      onPress={row.onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityHint={row.accessibilityHint}
      style={({ pressed }) => [rowStyle, interactive, (hovered || pressed) && styles.rowActive]}>
      {cells}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  table: { backgroundColor: semantic.surface, borderRadius: radius['2xl'], overflow: 'hidden', ...shadows.soft },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: sizes.touchTarget + spacing.ms, paddingHorizontal: spacing.ml },
  headerRow: { minHeight: sizes.touchTarget, backgroundColor: semantic.surfaceMuted },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semantic.border },
  rowActive: { backgroundColor: colors.primary[50] },
  cell: { paddingVertical: spacing.ms, paddingHorizontal: spacing.sm, minWidth: 0, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
});
