import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, IconCircle, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { colors } from '@/theme';
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
          <Text variant="caption" color={colors.gray[500]}>
            Đợt thanh toán tiếp theo
          </Text>
          <Text variant="bodyMedium" weight="semibold" numberOfLines={1}>
            {installment.name}
          </Text>
        </View>
        <Badge label={formatDaysLeft(installment.daysUntilDue)} tone={meta.tone} size="md" />
      </View>
      <View style={styles.body}>
        <View style={styles.flex}>
          <Text variant="caption" color={colors.gray[500]}>
            Số tiền
          </Text>
          <Text variant="h2" color={colors.primary[600]}>
            {formatCurrency(installment.remainingAmount)}
          </Text>
        </View>
        <View style={styles.dueCol}>
          <Text variant="caption" color={colors.gray[500]}>
            Hạn thanh toán
          </Text>
          <Text variant="bodyMedium" weight="semibold">
            {formatDate(installment.dueDate)}
          </Text>
        </View>
      </View>
      <Text variant="caption" color={colors.gray[500]}>
        {installment.contractCode} · {installment.projectName} · Căn {installment.unitCode}
      </Text>
      {onViewContract ? (
        <Button title="Xem lịch thanh toán" variant="secondary" size="sm" rightIcon="arrow-forward" onPress={onViewContract} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  body: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  dueCol: { alignItems: 'flex-end' },
});
