import { StyleSheet, View } from 'react-native';

import { Badge, Card, IconCircle, Skeleton, Text } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { receiptStatusMeta } from '@/lib/labels';
import { colors, fontSizes, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { Receipt } from '@/types';

/** Phiếu chỉ có tiền lãi (không trừ vào hợp đồng). */
const isInterestOnly = (r: Receipt) => !!r.allocation && r.allocation.interestAmount > 0 && r.allocation.parts.length === 0;

/** Màu số tiền theo trạng thái: đã thanh toán = xanh lá (phiếu tiền lãi = cam), chờ = chữ thường, đã hủy = mờ + gạch ngang. */
export function receiptAmountStyle(receipt: Receipt) {
  if (receipt.status === 'paid' && isInterestOnly(receipt)) return { color: toneColors.warning.fg, strike: false };
  if (receipt.status === 'paid') return { color: semantic.textSuccess, strike: false };
  if (receipt.status === 'cancelled') return { color: semantic.textMuted, strike: true };
  return { color: semantic.text, strike: false };
}

/**
 * Dòng phiếu thu dạng thẻ (mobile): icon tài liệu, mã phiếu, ngày · mã HĐ, số tiền, Badge trạng thái.
 * Có phân bổ (mẫu C): loại phiếu + "Đã trừ vào" từng đợt; phiếu tiền lãi tô cam.
 */
export function ReceiptCard({ receipt, onPress }: { receipt: Receipt; onPress?: () => void }) {
  const meta = receiptStatusMeta[receipt.status];
  const amount = receiptAmountStyle(receipt);
  const alloc = receipt.status === 'cancelled' ? undefined : receipt.allocation;
  const notes = alloc ? allocationNotes(alloc) : [];
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={[
        `Phiếu thu ${receipt.code}, ${formatCurrency(receipt.amount)}, ngày ${formatDate(receipt.paidDate)}, hợp đồng ${receipt.contractCode}, ${meta.label}`,
        alloc?.typeLabel,
        ...(alloc?.parts.map((p) => `trừ vào ${p.label} ${formatCurrency(p.amount)}`) ?? []),
        ...notes,
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Mở chi tiết phiếu thu">
      <View style={styles.row}>
        <IconCircle name="document" tone={isInterestOnly(receipt) && receipt.status === 'paid' ? 'warning' : meta.tone} />
        <View style={styles.main}>
          <Text variant="bodyStrong" weight="semibold" numberOfLines={2}>
            {receipt.code}
          </Text>
          <Text variant="caption" color={semantic.textMuted} numberOfLines={2}>
            {formatDate(receipt.paidDate)} · {receipt.contractCode}
          </Text>
          {alloc?.typeLabel ? (
            <Text variant="caption" weight="semibold" color={semantic.text}>
              {alloc.typeLabel}
            </Text>
          ) : null}
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
      {alloc && alloc.parts.length > 0 ? (
        <View style={styles.alloc}>
          <Text variant="label" color={semantic.textMuted}>
            ĐÃ TRỪ VÀO
          </Text>
          {alloc.parts.map((p) => (
            <View key={p.label} style={styles.allocRow}>
              <Text variant="caption" style={styles.main}>
                {p.label}
              </Text>
              <Text variant="caption" weight="semibold" numeric>
                {formatCurrency(p.amount)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {notes.map((n) => (
        <Text key={n} variant="caption" color={toneColors.warning.fg} style={styles.note}>
          {n}
        </Text>
      ))}
    </Card>
  );
}

/** Dòng giải thích phần tiền không trừ vào đợt: thu dư, hợp đồng đã chuyển nhượng (phiếu tiền lãi đã rõ qua loại phiếu + màu cam). */
function allocationNotes(a: NonNullable<Receipt['allocation']>): string[] {
  if (a.transferred) return ['Hợp đồng đã chuyển nhượng, tiền được tính theo hợp đồng mới'];
  const notes: string[] = [];
  if (a.unallocatedAmount > 0) notes.push(`Chưa trừ vào đợt nào: ${formatCurrency(a.unallocatedAmount)}`);
  return notes;
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
  alloc: { marginTop: spacing.ms, backgroundColor: semantic.surfaceMuted, borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.ms, gap: spacing.xs },
  allocRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  note: { marginTop: spacing.sm },
  strike: { textDecorationLine: 'line-through', textDecorationColor: colors.gray[400] },
});
