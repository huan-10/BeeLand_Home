import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type { ReceiptsSummary } from '@/lib/receiptAllocation';
import { colors, radius, semantic, sizes, spacing, toneColors } from '@/theme';

/**
 * Tổng đối chiếu đầu tab Phiếu thu (mẫu C): tổng tiền các phiếu = phần trừ vào hợp đồng + tiền lãi (+ chưa trừ vào đợt nào).
 * Chỉ dùng khi hai số lệch nhau — lúc khách dễ thắc mắc "thu nhiều thế mà vẫn còn nợ".
 */
export function ReceiptsSummaryCard({ summary }: { summary: ReceiptsSummary }) {
  const rows = [
    { key: 'hd', label: 'Trừ vào hợp đồng', value: summary.intoContract, color: colors.primary[500] },
    { key: 'lai', label: 'Tiền lãi chậm thanh toán', value: summary.interest, color: toneColors.warning.solid },
    { key: 'du', label: 'Chưa trừ vào đợt nào', value: summary.unallocated, color: colors.gray[400] },
  ].filter((r) => r.value > 0);
  return (
    <Card
      accessible
      accessibilityLabel={[`Tổng tiền các phiếu ${formatCurrency(summary.total)}`, ...rows.map((r) => `${r.label} ${formatCurrency(r.value)}`)].join(', ')}>
      <View style={styles.wrap}>
        <View style={styles.row}>
          <Text variant="caption" color={semantic.textMuted} style={styles.flex}>
            Tổng tiền các phiếu
          </Text>
          <Text variant="bodyStrong" weight="bold" numeric>
            {formatCurrency(summary.total)}
          </Text>
        </View>
        <View style={styles.bar}>
          {rows.map((r) => (
            <View key={r.key} style={{ flex: r.value, backgroundColor: r.color }} />
          ))}
        </View>
        {rows.map((r) => (
          <View key={r.key} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text variant="caption" style={styles.flex}>
              {r.label}
            </Text>
            <Text variant="caption" weight="semibold" numeric>
              {formatCurrency(r.value)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  bar: { flexDirection: 'row', height: sizes.progress.md, borderRadius: radius.full, overflow: 'hidden', backgroundColor: semantic.surfaceMuted },
  dot: { width: sizes.dot.md, height: sizes.dot.md, borderRadius: radius.full },
});
