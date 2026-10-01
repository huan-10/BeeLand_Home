import { StyleSheet, View } from 'react-native';

import { Button, Dialog, KeyValueRow, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { radius, semantic, spacing } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

export interface PaymentConfirmDialogProps {
  visible: boolean;
  installment: PaymentInstallmentView;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Xác nhận khoản cần thanh toán trước khi chuyển sang cổng thanh toán. */
export function PaymentConfirmDialog({ visible, installment, submitting, onConfirm, onClose }: PaymentConfirmDialogProps) {
  const overdue = installment.status === 'overdue';
  return (
    <Dialog
      visible={visible}
      title="Xác nhận thanh toán"
      onClose={onClose}
      actions={
        <>
          <Button title="Hủy" variant="ghost" onPress={onClose} disabled={submitting} />
          <Button title="Xác nhận thanh toán" leftIcon="card" loading={submitting} onPress={onConfirm} />
        </>
      }>
      <View style={styles.amountBox}>
        <Text variant="caption" color={semantic.onInverseMuted}>
          Số tiền cần thanh toán
        </Text>
        <Text variant="title" color={semantic.onInverse} numeric>
          {formatCurrency(installment.remainingAmount)}
        </Text>
        <Text variant="caption" weight="semibold" color={overdue ? semantic.onInverseAccent : semantic.onInverseMuted}>
          {formatDaysLeft(installment.daysUntilDue)}
        </Text>
      </View>
      <View>
        <KeyValueRow label="Hợp đồng" value={installment.contractCode} />
        <KeyValueRow label="Đợt thanh toán" value={installment.name} />
        <KeyValueRow label="Căn hộ" value={`${installment.unitCode} · ${installment.projectName}`} />
        <KeyValueRow label="Hạn thanh toán" value={formatDate(installment.dueDate)} numeric last />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  amountBox: { alignItems: 'center', gap: spacing.xs, padding: spacing.ml, borderRadius: radius.xl, backgroundColor: semantic.inverse },
});
