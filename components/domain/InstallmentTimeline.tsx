import { StyleSheet, View } from 'react-native';

import { Badge, Icon, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { colors, toneColors } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

/** Lịch thanh toán dạng dòng thời gian cho trang chi tiết hợp đồng. */
export function InstallmentTimeline({ installments }: { installments: PaymentInstallmentView[] }) {
  return (
    <View>
      {installments.map((item, index) => {
        const meta = installmentStatusMeta[item.status];
        const tone = toneColors[meta.tone];
        const isLast = index === installments.length - 1;
        const isPaid = item.status === 'paid';
        return (
          <View key={item.id} style={styles.item}>
            <View style={styles.rail}>
              <View style={[styles.node, { backgroundColor: isPaid ? tone.solid : colors.white, borderColor: tone.solid }]}>
                {isPaid ? (
                  <Icon name="checkmark" size={14} color={colors.white} />
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
              <Text variant="h3" color={isPaid ? colors.gray[900] : tone.fg}>
                {formatCurrency(item.amount)}
              </Text>
              <Text variant="caption" color={colors.gray[500]}>
                {item.percentOfContract}% giá trị HĐ ·{' '}
                {isPaid && item.paidDate
                  ? `Thanh toán ngày ${formatDate(item.paidDate)}`
                  : `Hạn ${formatDate(item.dueDate)} (${formatDaysLeft(item.daysUntilDue).toLowerCase()})`}
              </Text>
              {item.description ? (
                <Text variant="caption" color={colors.gray[400]}>
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
  item: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 28 },
  node: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 2, backgroundColor: colors.gray[200], marginVertical: 4 },
  content: { flex: 1, gap: 4, paddingTop: 2 },
  contentGap: { paddingBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
