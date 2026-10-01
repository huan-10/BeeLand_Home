import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, IconCircle, ProgressBar, Text } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/lib/format';
import { contractStatusMeta, contractTypeLabels } from '@/lib/labels';
import { colors } from '@/theme';
import type { ContractListItem } from '@/types';

export interface ContractCardProps {
  contract: ContractListItem;
  onPress?: () => void;
}

export function ContractCard({ contract, onPress }: ContractCardProps) {
  const status = contractStatusMeta[contract.status];
  const { summary } = contract;

  return (
    <Card onPress={onPress} accessibilityLabel={`Hợp đồng ${contract.code}`}>
      <View style={styles.header}>
        <IconCircle name="document-text" tone={contract.type === 'purchase' ? 'primary' : 'info'} />
        <View style={styles.titleCol}>
          <Text variant="bodyMedium" weight="semibold" numberOfLines={1}>
            {contract.code}
          </Text>
          <Text variant="small" color={colors.gray[500]} numberOfLines={1}>
            {contractTypeLabels[contract.type].label}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} dot />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Icon name="business-outline" size={16} color={colors.gray[400]} />
          <Text variant="small" color={colors.gray[600]} numberOfLines={1}>
            {contract.projectName} · Căn {contract.unitCode}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text variant="caption" color={colors.gray[500]}>
            Giá trị hợp đồng
          </Text>
          <Text variant="h3" color={colors.gray[900]}>
            {formatCurrency(contract.totalValue)}
          </Text>
        </View>
        <Text variant="smallMedium" color={colors.primary[600]}>
          {formatPercent(summary.paidPercent)}
        </Text>
      </View>

      <ProgressBar value={summary.paidPercent} tone={summary.overdueCount > 0 ? 'danger' : 'primary'} />
      <View style={styles.footer}>
        <Text variant="caption" color={colors.gray[500]}>
          Đã thanh toán {formatCurrency(summary.paidAmount)}
        </Text>
        <Text variant="caption" color={colors.gray[500]}>
          {summary.paidInstallmentCount}/{summary.installmentCount} đợt
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleCol: { flex: 1, gap: 2 },
  meta: { marginTop: 14, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
});
