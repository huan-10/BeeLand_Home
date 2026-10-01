import { StyleSheet, View } from 'react-native';

import { Badge, Card, IconCircle, Skeleton, Text } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { receiptStatusMeta } from '@/lib/labels';
import { colors, fontSizes, radius, semantic, sizes, spacing } from '@/theme';
import type { Receipt } from '@/types';

/** Màu số tiền theo trạng thái: đã thanh toán = xanh lá, chờ = chữ thường, đã hủy = mờ + gạch ngang. */
export function receiptAmountStyle(receipt: Receipt) {
  if (receipt.status === 'paid') return { color: semantic.textSuccess, strike: false };
  if (receipt.status === 'cancelled') return { color: semantic.textMuted, strike: true };
  return { color: semantic.text, strike: false };
}

/** Dòng phiếu thu dạng thẻ (mobile): icon tài liệu, mã phiếu, ngày · mã HĐ, số tiền, Badge trạng thái. */
export function ReceiptCard({ receipt, onPress }: { receipt: Receipt; onPress?: () => void }) {
  const meta = receiptStatusMeta[receipt.status];
  const amount = receiptAmountStyle(receipt);
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Phiếu thu ${receipt.code}, ${formatCurrency(receipt.amount)}, ngày ${formatDate(receipt.paidDate)}, hợp đồng ${receipt.contractCode}, ${meta.label}`}
      accessibilityHint="Mở chi tiết phiếu thu">
      <View style={styles.row}>
        <IconCircle name="document" tone={meta.tone} />
        <View style={styles.main}>
          <Text variant="bodyStrong" weight="semibold">
            {receipt.code}
          </Text>
          <Text variant="caption" color={semantic.textMuted}>
            {formatDate(receipt.paidDate)} · {receipt.contractCode}
          </Text>
        </View>
        <View style={styles.right}>
          <Text
            variant="captionStrong"
            weight="bold"
            color={amount.color}
            align="right"
            style={[styles.amount, amount.strike && styles.strike]} numeric>
            {formatCurrency(receipt.amount)}
          </Text>
          <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
        </View>
      </View>
    </Card>
  );
}

export function ReceiptCardSkeleton() {
  return (
    <Card>
      <View style={styles.row}>
        <Skeleton width={sizes.iconBox.lg} height={sizes.iconBox.lg} radius={radius.md} />
        <View style={styles.main}>
          <Skeleton width="55%" height={fontSizes.body.fontSize} />
          <Skeleton width="75%" height={fontSizes.label.fontSize} />
        </View>
        <View style={styles.right}>
          <Skeleton width={sizes.skeleton.amountWidth} height={fontSizes.caption.fontSize} />
          <Skeleton width={sizes.skeleton.badgeWidth} height={fontSizes.heading.fontSize} radius={radius.full} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  main: { flex: 1, minWidth: 0, gap: spacing.xs },
  right: { alignItems: 'flex-end', gap: spacing.xs, flexShrink: 0 },
  amount: { fontVariant: ['tabular-nums'] },
  strike: { textDecorationLine: 'line-through', textDecorationColor: colors.gray[400] },
});
