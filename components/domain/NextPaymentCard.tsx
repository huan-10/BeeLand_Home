import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, IconCircle, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { semantic, spacing } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

export interface NextPaymentCardProps {
  installment: PaymentInstallmentView;
  /** Bấm cả thẻ → mở hợp đồng của đợt này. */
  onViewContract?: () => void;
}

/** Đợt thanh toán tiếp theo — gọn: tên đợt + số ngày còn lại, số tiền lớn, một dòng "Hạn · Căn · HĐ"; cả thẻ bấm được. */
export function NextPaymentCard({ installment, onViewContract }: NextPaymentCardProps) {
  const meta = installmentStatusMeta[installment.status];
  const days = formatDaysLeft(installment.daysUntilDue);
  return (
    <Card
      onPress={onViewContract}
      style={styles.card}
      accessibilityLabel={`Đợt thanh toán tiếp theo: ${installment.name}, ${formatCurrency(installment.remainingAmount)}, hạn ${formatDate(installment.dueDate)}, ${days}`}
      accessibilityHint={onViewContract ? 'Mở hợp đồng' : undefined}>
      <View style={styles.row}>
        <IconCircle name="alarm" tone={meta.tone} />
        <View style={styles.flex}>
          <Text variant="caption" color={semantic.textMuted}>
            Đợt tiếp theo · {installment.name}
          </Text>
          <Text variant="title" color={semantic.textBrand} numeric>
            {formatCurrency(installment.remainingAmount)}
          </Text>
        </View>
        {onViewContract ? <Icon name="chevronRight" size="sm" color={semantic.iconMuted} /> : null}
      </View>
      <View style={styles.row}>
        <Badge label={days} tone={meta.tone} />
        <Text variant="caption" color={semantic.textMuted} style={styles.flex} numberOfLines={2}>
          Hạn {formatDate(installment.dueDate)} · Căn {installment.unitCode} · {installment.contractCode}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.ms },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  flex: { flex: 1, minWidth: 0 },
});
