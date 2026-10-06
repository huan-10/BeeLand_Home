import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge, DataTable, Icon, Text, type DataTableColumn, type DataTableRow } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatCurrency, formatDate } from '@/lib/format';
import { receiptStatusMeta } from '@/lib/labels';
import { semantic, spacing } from '@/theme';
import type { Receipt } from '@/types';

import { ReceiptCard, receiptAmountStyle } from './ReceiptCard';

type Col = 'code' | 'date' | 'contract' | 'amount' | 'status';
const columns: DataTableColumn<Col>[] = [
  { key: 'code', title: 'Mã phiếu', flex: 2 },
  { key: 'date', title: 'Ngày thu', flex: 1.5 },
  { key: 'contract', title: 'Hợp đồng', flex: 2.2 },
  { key: 'amount', title: 'Số tiền', flex: 2, align: 'right' },
  { key: 'status', title: 'Trạng thái', flex: 2 },
];

const openReceipt = (r: Receipt) => router.push({ pathname: '/receipts/[id]', params: { id: r.id } });

/** Danh sách phiếu thu: desktop bảng, mobile/tablet thẻ. Bấm mở chi tiết phiếu. */
export function ReceiptList({ receipts, accessibilityLabel }: { receipts: Receipt[]; accessibilityLabel: string }) {
  const { isDesktop } = useBreakpoint();
  if (isDesktop) return <DataTable accessibilityLabel={accessibilityLabel} columns={columns} rows={receipts.map(toRow)} />;
  return (
    <View style={styles.list}>
      {receipts.map((r) => (
        <ReceiptCard key={r.id} receipt={r} onPress={() => openReceipt(r)} />
      ))}
    </View>
  );
}

function toRow(r: Receipt): DataTableRow<Col> {
  const meta = receiptStatusMeta[r.status];
  const amount = receiptAmountStyle(r);
  return {
    key: r.id,
    onPress: () => openReceipt(r),
    accessibilityHint: `Mở phiếu thu ${r.code}`,
    cells: {
      code: (
        <View style={styles.codeCell}>
          <Icon name="document" size="sm" color={semantic.iconMuted} />
          <Text variant="captionStrong" weight="semibold" style={styles.flex}>
            {r.code}
          </Text>
        </View>
      ),
      date: <Text variant="caption">{formatDate(r.paidDate)}</Text>,
      contract: <Text variant="caption">{r.contractCode}</Text>,
      amount: (
        <Text variant="captionStrong" weight="bold" color={amount.color} align="right" style={[styles.amount, amount.strike && styles.strike]} numeric>
          {formatCurrency(r.amount)}
        </Text>
      ),
      status: <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />,
    },
  };
}

const styles = StyleSheet.create({
  list: { gap: spacing.ms },
  flex: { flex: 1, minWidth: 0 },
  codeCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amount: { fontVariant: ['tabular-nums'] },
  strike: { textDecorationLine: 'line-through' },
});
