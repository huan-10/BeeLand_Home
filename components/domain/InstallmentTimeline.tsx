import { StyleSheet, View } from 'react-native';

import { Badge, Icon, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { borderWidth, colors, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

/** Lịch thanh toán dạng timeline (theo mockup): nút tròn + đường nối, đã trả tô màu. */
export function InstallmentTimeline({ installments }: { installments: PaymentInstallmentView[] }) {
  return (
    <View accessibilityRole="list">
      {installments.map((item, index) => {
        const meta = installmentStatusMeta[item.status];
        const tone = toneColors[meta.tone];
        const isLast = index === installments.length - 1;
        const isPaid = item.status === 'paid';
        return (
          <View key={item.id} style={styles.item} accessibilityLabel={`${item.name}, ${formatCurrency(item.amount)}, ${meta.label}`}>
            <View style={styles.rail}>
              <View style={[styles.node, { backgroundColor: isPaid ? tone.solid : semantic.surface, borderColor: tone.solid }]}>
                {isPaid ? (
                  <Icon name="checkmark" size="sm" color={semantic.textOnPrimary} />
                ) : (
                  <Text variant="caption" weight="bold" color={tone.fg}>
                    {item.sequence}
                  </Text>
                )}
              </View>
              {!isLast ? <View style={[styles.line, isPaid && { backgroundColor: tone.solid }]} /> : null}
            </View>
            <View style={[styles.content, !isLast && styles.contentGap]}>
              <View style={styles.titleRow}>
                <Text variant="bodyMedium" weight="semibold" style={styles.flex}>
                  {item.name}
                </Text>
                <Badge label={meta.label} tone={meta.tone} />
              </View>
              <Text variant="h3" color={isPaid ? semantic.text : tone.fg}>
                {formatCurrency(item.amount)}
              </Text>
              <Text variant="caption" color={semantic.textMuted}>
                {item.percentOfContract}% giá trị HĐ ·{' '}
                {isPaid && item.paidDate
                  ? `Thanh toán ngày ${formatDate(item.paidDate)}`
                  : `Hạn ${formatDate(item.dueDate)} (${formatDaysLeft(item.daysUntilDue).toLowerCase()})`}
              </Text>
              {item.description ? (
                <Text variant="caption" color={semantic.textMuted}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.ms },
  rail: { alignItems: 'center', width: sizes.timelineNode },
  node: {
    width: sizes.timelineNode,
    height: sizes.timelineNode,
    borderRadius: radius.full,
    borderWidth: borderWidth.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, width: borderWidth.strong, backgroundColor: colors.gray[200], marginVertical: spacing.xs },
  content: { flex: 1, gap: spacing.xs, paddingTop: spacing['2xs'] },
  contentGap: { paddingBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
