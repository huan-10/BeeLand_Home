import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { colors, toneColors } from '@/theme';
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
  const dateColor = installment.status === 'overdue' ? colors.danger[600] : colors.gray[500];

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: toneColors[meta.tone].bg }]}>
          <Icon name={isPaid ? 'checkmark-circle' : 'calendar'} size={22} color={toneColors[meta.tone].fg} />
        </View>
        <View style={styles.main}>
          <Text variant="bodyMedium" weight="semibold" numberOfLines={1}>
            {installment.name}
          </Text>
          {showContract ? (
            <Text variant="caption" color={colors.gray[500]} numberOfLines={1}>
              {installment.contractCode} · Căn {installment.unitCode}
            </Text>
          ) : null}
        </View>
        <Text variant="smallMedium" weight="bold" align="right">
          {formatCurrency(installment.amount)}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text variant="caption" weight="medium" color={dateColor} style={styles.date} numberOfLines={1}>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, gap: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  date: { flex: 1 },
});
