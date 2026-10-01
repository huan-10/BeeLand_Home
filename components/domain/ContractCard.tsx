import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, IconCircle, ProgressBar, Text } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/lib/format';
import { contractStatusMeta, contractTypeLabels } from '@/lib/labels';
import { semantic, spacing } from '@/theme';
import type { ContractListItem } from '@/types';

export interface ContractCardProps {
  contract: ContractListItem;
  onPress?: () => void;
}

export function ContractCard({ contract, onPress }: ContractCardProps) {
  const status = contractStatusMeta[contract.status];
  const { summary } = contract;

  return (
    <Card onPress={onPress} accessibilityLabel={`Hợp đồng ${contract.code}, ${status.label}`}>
      <View style={styles.header}>
        <IconCircle name="document-text" tone={contract.type === 'purchase' ? 'primary' : 'info'} />
        <View style={styles.titleCol}>
          <Text variant="bodyMedium" weight="semibold" numberOfLines={1}>
            {contract.code}
          </Text>
          <Text variant="small" color={semantic.textMuted} numberOfLines={1}>
            {contractTypeLabels[contract.type].label}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} dot />
      </View>

      <View style={styles.metaItem}>
        <Icon name="business-outline" size="sm" color={semantic.iconMuted} />
        <Text variant="small" color={semantic.textSecondary} numberOfLines={1}>
          {contract.projectName} · Căn {contract.unitCode}
        </Text>
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text variant="caption" color={semantic.textMuted}>
            Giá trị hợp đồng
          </Text>
          <Text variant="h3">{formatCurrency(contract.totalValue)}</Text>
        </View>
        <Text variant="smallMedium" weight="semibold" color={semantic.textBrand}>
          {formatPercent(summary.paidPercent)}
        </Text>
      </View>

      <ProgressBar
        value={summary.paidPercent}
        tone={summary.overdueCount > 0 ? 'danger' : 'primary'}
        accessibilityLabel={`Đã thanh toán ${formatPercent(summary.paidPercent)}`}
      />
      <View style={styles.footer}>
        <Text variant="caption" color={semantic.textMuted}>
          Đã thanh toán {formatCurrency(summary.paidAmount)}
        </Text>
        <Text variant="caption" color={semantic.textMuted}>
          {summary.paidInstallmentCount}/{summary.installmentCount} đợt
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  titleCol: { flex: 1, gap: spacing['2xs'] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.ms },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.ms, marginBottom: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
});
