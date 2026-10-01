import { StyleSheet, View } from 'react-native';

import { Badge, Card, IconCircle, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { borderWidth, colors, semantic, spacing } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

export interface InstallmentCardProps {
  installment: PaymentInstallmentView;
  /** Hiển thị số hợp đồng / mã căn (dùng ở màn Thanh toán gộp nhiều hợp đồng). */
  showContract?: boolean;
  onPress?: () => void;
}

export function InstallmentCard({ installment, showContract, onPress }: InstallmentCardProps) {
  const meta = installmentStatusMeta[installment.status];
  const isPaid = installment.status === 'paid';
  const dateColor = installment.status === 'overdue' ? colors.danger[600] : semantic.textMuted;

  return (
    <Card onPress={onPress} accessibilityLabel={`${installment.name}, ${formatCurrency(installment.amount)}, ${meta.label}`}>
      <View style={styles.row}>
        <IconCircle name={isPaid ? 'checkCircle' : 'calendar'} tone={meta.tone} />
        <View style={styles.main}>
          <Text variant="bodyStrong" weight="semibold">
            {installment.name}
          </Text>
          {showContract ? (
            <Text variant="caption" color={semantic.textMuted}>
              {installment.contractCode} · Căn {installment.unitCode}
            </Text>
          ) : null}
        </View>
        <Text variant="captionStrong" weight="bold" align="right" numeric>
          {formatCurrency(installment.amount)}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text variant="caption" weight="medium" color={dateColor} style={styles.date}>
          {isPaid && installment.paidDate
            ? `Đã thanh toán ${formatDate(installment.paidDate)}`
            : `Hạn ${formatDate(installment.dueDate)} · ${formatDaysLeft(installment.daysUntilDue)}`}
        </Text>
        <Badge label={meta.label} tone={meta.tone} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  main: { flex: 1, gap: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.ms,
    paddingTop: spacing.ms,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: semantic.border,
  },
  date: { flex: 1 },
});
