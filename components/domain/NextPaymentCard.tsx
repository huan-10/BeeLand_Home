import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, IconCircle, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { semantic, spacing } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

export interface NextPaymentCardProps {
  installment: PaymentInstallmentView;
  onViewContract?: () => void;
}

/** Thẻ nổi bật đợt thanh toán sắp tới. */
export function NextPaymentCard({ installment, onViewContract }: NextPaymentCardProps) {
  const meta = installmentStatusMeta[installment.status];
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconCircle name="alarm" tone={meta.tone} />
        <View style={styles.flex}>
          <Text variant="caption" color={semantic.textMuted}>
            Đợt thanh toán tiếp theo
          </Text>
          <Text variant="bodyStrong" weight="semibold">
            {installment.name}
          </Text>
        </View>
        <Badge label={formatDaysLeft(installment.daysUntilDue)} tone={meta.tone} size="md" />
      </View>
      <View style={styles.body}>
        <View style={styles.flex}>
          <Text variant="caption" color={semantic.textMuted}>
            Số tiền
          </Text>
          <Text variant="title" color={semantic.textBrand} numeric>
            {formatCurrency(installment.remainingAmount)}
          </Text>
        </View>
        <View style={styles.dueCol}>
          <Text variant="caption" color={semantic.textMuted}>
            Hạn thanh toán
          </Text>
          <Text variant="bodyStrong" weight="semibold">
            {formatDate(installment.dueDate)}
          </Text>
        </View>
      </View>
      <Text variant="caption" color={semantic.textMuted}>
        {installment.contractCode} · {installment.projectName} · Căn {installment.unitCode}
      </Text>
      {onViewContract ? (
        <Button title="Xem lịch thanh toán" variant="secondary" size="sm" rightIcon="arrowRight" onPress={onViewContract} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  flex: { flex: 1 },
  body: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.ms },
  dueCol: { alignItems: 'flex-end' },
});
