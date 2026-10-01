import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatCurrency, formatPercent } from '@/lib/format';
import { colors, radius, shadows } from '@/theme';

export interface PaymentOverviewCardProps {
  title: string;
  totalValue: number;
  paidAmount: number;
  remainingAmount: number;
  paidPercent: number;
}

/** Thẻ tổng quan nền cam: tổng giá trị, đã thanh toán, còn lại và tiến độ. */
export function PaymentOverviewCard({ title, totalValue, paidAmount, remainingAmount, paidPercent }: PaymentOverviewCardProps) {
  const { isWide } = useBreakpoint();
  const amountVariant = isWide ? 'bodyMedium' : 'smallMedium';
  return (
    <LinearGradient
      colors={[colors.primary[400], colors.primary[600]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.md]}>
      <Text variant="small" color={colors.primary[50]}>
        {title}
      </Text>
      <Text variant={isWide ? 'display' : 'h1'} color={colors.white} style={styles.total} numberOfLines={1}>
        {formatCurrency(totalValue)}
      </Text>

      <View style={styles.progressRow}>
        <Text variant="caption" weight="medium" color={colors.primary[50]}>
          Tiến độ thanh toán
        </Text>
        <Text variant="smallMedium" weight="bold" color={colors.white}>
          {formatPercent(paidPercent)}
        </Text>
      </View>
      <ProgressBar value={paidPercent} tone="success" trackColor="rgba(255,255,255,0.3)" height={8} />

      <View style={styles.split}>
        <View style={styles.splitItem}>
          <Text variant="caption" color={colors.primary[50]}>
            Đã thanh toán
          </Text>
          <Text variant={amountVariant} weight="bold" color={colors.white} numberOfLines={1}>
            {formatCurrency(paidAmount)}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.splitItem}>
          <Text variant="caption" color={colors.primary[50]}>
            Còn lại
          </Text>
          <Text variant={amountVariant} weight="bold" color={colors.white} numberOfLines={1}>
            {formatCurrency(remainingAmount)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: 20, gap: 8, overflow: 'hidden' },
  total: { marginBottom: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  split: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  splitItem: { flex: 1, gap: 2 },
  separator: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
});
