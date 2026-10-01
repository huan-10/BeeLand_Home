import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatCurrency, formatPercent } from '@/lib/format';
import { borderWidth, colors, radius, semantic, shadows, spacing } from '@/theme';

export interface PaymentOverviewCardProps {
  title: string;
  totalValue: number;
  paidAmount: number;
  remainingAmount: number;
  paidPercent: number;
}

/** Thẻ tổng quan nền cam (theo mockup): tổng giá trị, đã thanh toán, còn lại và tiến độ. */
export function PaymentOverviewCard({ title, totalValue, paidAmount, remainingAmount, paidPercent }: PaymentOverviewCardProps) {
  const { isWide } = useBreakpoint();
  const amountVariant = isWide ? 'bodyMedium' : 'smallMedium';
  const onPrimary = semantic.textOnPrimary;

  return (
    <LinearGradient
      colors={[colors.primary[500], colors.primary[700]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.md]}>
      <Text variant="smallMedium" color={onPrimary}>
        {title}
      </Text>
      <Text variant={isWide ? 'display' : 'h1'} color={onPrimary} style={styles.total} numberOfLines={1}>
        {formatCurrency(totalValue)}
      </Text>

      <View style={styles.progressRow}>
        <Text variant="caption" weight="medium" color={onPrimary}>
          Tiến độ thanh toán
        </Text>
        <Text variant="smallMedium" weight="bold" color={onPrimary}>
          {formatPercent(paidPercent)}
        </Text>
      </View>
      <ProgressBar
        value={paidPercent}
        tone="success"
        trackColor={colors.overlay.onPrimaryMuted}
        accessibilityLabel={`Tiến độ thanh toán ${formatPercent(paidPercent)}`}
      />

      <View style={styles.split}>
        <View style={styles.splitItem}>
          <Text variant="caption" color={onPrimary}>
            Đã thanh toán
          </Text>
          <Text variant={amountVariant} weight="bold" color={onPrimary} numberOfLines={1}>
            {formatCurrency(paidAmount)}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.splitItem}>
          <Text variant="caption" color={onPrimary}>
            Còn lại
          </Text>
          <Text variant={amountVariant} weight="bold" color={onPrimary} numberOfLines={1}>
            {formatCurrency(remainingAmount)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: spacing.ml, gap: spacing.sm, overflow: 'hidden' },
  total: { marginBottom: spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  split: {
    flexDirection: 'row',
    marginTop: spacing.ms,
    padding: spacing.ms,
    borderRadius: radius.md,
    backgroundColor: colors.overlay.onPrimarySubtle,
  },
  splitItem: { flex: 1, gap: spacing['2xs'] },
  separator: { width: borderWidth.hairline, backgroundColor: colors.overlay.onPrimaryMuted, marginHorizontal: spacing.ms },
});
