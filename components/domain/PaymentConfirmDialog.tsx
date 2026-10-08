import { StyleSheet, View } from 'react-native';

import { Button, Dialog, KeyValueRow, Text } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { payTargetDeadline } from '@/lib/paymentTarget';
import { radius, semantic, spacing } from '@/theme';
import type { PayTarget } from '@/types';

export interface PaymentConfirmDialogProps {
  visible: boolean;
  target: PayTarget;
  submitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Xác nhận khoản cần thanh toán trước khi mở mã QR chuyển khoản. */
export function PaymentConfirmDialog({ visible, target, submitting = false, onConfirm, onClose }: PaymentConfirmDialogProps) {
  const overdue = target.daysUntilDue != null && target.daysUntilDue < 0;
  const deadline = payTargetDeadline(target);
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
          {formatCurrency(target.amount)}
        </Text>
        {deadline ? (
          <Text variant="caption" weight="semibold" color={overdue ? semantic.onInverseAccent : semantic.onInverseMuted}>
            {deadline}
          </Text>
        ) : null}
      </View>
      <View>
        <KeyValueRow label="Hợp đồng" value={target.contractCode} />
        <KeyValueRow label="Khoản thanh toán" value={target.name} />
        <KeyValueRow label="Căn hộ" value={`${target.unitCode} · ${target.projectName}`} last={!target.dueDate} />
        {target.dueDate ? <KeyValueRow label="Hạn thanh toán" value={formatDate(target.dueDate)} numeric last /> : null}
      </View>
      <Text variant="caption" color={semantic.textMuted}>
        Bước tiếp theo: quét mã QR bằng ứng dụng ngân hàng. Hệ thống tự ghi nhận khi nhận được tiền.
      </Text>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  amountBox: { alignItems: 'center', gap: spacing.xs, padding: spacing.ml, borderRadius: radius.xl, backgroundColor: semantic.inverse },
});
