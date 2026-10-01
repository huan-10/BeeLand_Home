import { StyleSheet, View } from 'react-native';

import { Badge, Icon, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { borderWidth, colors, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

/**
 * Lịch thanh toán dạng timeline (theo mockup):
 * xanh lá + dấu tick = đã thanh toán · cam = đến hạn · xám = chưa đến hạn · đỏ = quá hạn.
 * Mỗi đợt có icon trong nút tròn + Badge có chữ và icon, nên không phụ thuộc màu.
 */
export function InstallmentTimeline({ installments }: { installments: PaymentInstallmentView[] }) {
  return (
    <View role="list" aria-label="Lịch thanh toán">
      {installments.map((item, index) => {
        const meta = installmentStatusMeta[item.status];
        const tone = toneColors[meta.tone];
        const isLast = index === installments.length - 1;
        const isPaid = item.status === 'paid';
        const filled = item.status !== 'scheduled';
        const dateText =
          isPaid && item.paidDate
            ? `Đã thanh toán ngày ${formatDate(item.paidDate)}`
            : `Hạn ${formatDate(item.dueDate)} · ${formatDaysLeft(item.daysUntilDue)}`;
        return (
          <View
            key={item.id}
            style={styles.item}
            role="listitem"
            accessible
            accessibilityLabel={`${item.name}, ${formatCurrency(item.amount)}, ${dateText}, ${meta.label}`}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  { backgroundColor: filled ? tone.solid : semantic.surface, borderColor: filled ? tone.solid : colors.gray[300] },
                ]}>
                <Icon name={meta.icon} size="sm" color={filled ? tone.onSolid : semantic.textMuted} />
              </View>
              {!isLast ? <View style={[styles.line, isPaid && { backgroundColor: tone.solid }]} /> : null}
            </View>
            <View style={[styles.content, !isLast && styles.contentGap]}>
              <View style={styles.titleRow}>
                <Text variant="bodyStrong" weight="semibold" style={styles.flex}>
                  {item.name}
                </Text>
                <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
              </View>
              <Text variant="heading" color={isPaid ? semantic.text : tone.fg} numeric>
                {formatCurrency(item.amount)}
              </Text>
              <Text variant="caption" color={item.status === 'overdue' ? colors.danger[700] : semantic.textMuted}>
                {item.percentOfContract}% giá trị HĐ · {dateText}
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
  content: { flex: 1, minWidth: 0, gap: spacing.xs, paddingTop: spacing.xs },
  contentGap: { paddingBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
});
