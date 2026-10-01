import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ReceiptCard, ReceiptCardSkeleton, receiptAmountStyle } from '@/components/domain';
import { Screen } from '@/components/layout';
import {
  Badge,
  Card,
  Chip,
  DataTable,
  EmptyState,
  ErrorState,
  Icon,
  IconCircle,
  ScreenHeader,
  Skeleton,
  Text,
  type DataTableColumn,
  type DataTableRow,
} from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useReceiptList } from '@/hooks/useReceipts';
import { formatCurrency, formatDate } from '@/lib/format';
import { receiptStatusMeta } from '@/lib/labels';
import type { ReceiptTabCounts } from '@/lib/receipt';
import { chipRow, radius, semantic, sizes, spacing } from '@/theme';
import type { Receipt, ReceiptTab } from '@/types';

const tabs: { value: ReceiptTab; label: string; unit: string }[] = [
  { value: 'all', label: 'Tất cả', unit: 'phiếu thu' },
  { value: 'paid', label: 'Đã thanh toán', unit: 'phiếu thu' },
  { value: 'byContract', label: 'Theo hợp đồng', unit: 'hợp đồng' },
];

type Col = 'code' | 'date' | 'contract' | 'amount' | 'status';
const columns: DataTableColumn<Col>[] = [
  { key: 'code', title: 'Mã phiếu', flex: 2 },
  { key: 'date', title: 'Ngày thu', flex: 1.5 },
  { key: 'contract', title: 'Hợp đồng', flex: 2.2 },
  { key: 'amount', title: 'Số tiền', flex: 2, align: 'right' },
  { key: 'status', title: 'Trạng thái', flex: 2 },
];
const SKELETON_COUNT = 4;

const openReceipt = (r: Receipt) => router.push({ pathname: '/receipts/[id]', params: { id: r.id } });

export default function ReceiptsScreen() {
  const [tab, setTab] = useState<ReceiptTab>('all');
  const { isDesktop } = useBreakpoint();
  const { data, receipts, groups, counts, paidTotal, loading, refreshing, error, refetch } = useReceiptList(tab);

  /** Desktop: bảng; mobile/tablet: danh sách thẻ. */
  const renderList = (items: Receipt[], label: string) =>
    isDesktop ? (
      <DataTable accessibilityLabel={label} columns={columns} rows={items.map(toRow)} />
    ) : (
      <View style={styles.list}>
        {items.map((r) => (
          <ReceiptCard key={r.id} receipt={r} onPress={() => openReceipt(r)} />
        ))}
      </View>
    );

  const isEmpty = tab === 'byContract' ? groups.length === 0 : receipts.length === 0;

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Phiếu thu" subtitle="Chứng từ các khoản bạn đã thanh toán" />

      {data ? <TotalCard paidTotal={paidTotal} counts={counts} /> : null}

      <View style={chipRow} accessibilityRole="tablist">
        {tabs.map((t) => (
          <Chip
            key={t.value}
            role="tab"
            label={t.label}
            count={data ? counts[t.value] : undefined}
            selected={tab === t.value}
            onPress={() => setTab(t.value)}
            accessibilityLabel={data ? `${t.label}, ${counts[t.value]} ${t.unit}` : t.label}
          />
        ))}
      </View>

      {loading ? (
        isDesktop ? (
          <Card padding="none">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <View key={i} style={styles.skeletonRow}>
                <Skeleton height={sizes.control.sm} radius={radius.sm} />
              </View>
            ))}
          </Card>
        ) : (
          <View style={styles.list}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ReceiptCardSkeleton key={i} />
            ))}
          </View>
        )
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => void refetch()} />
        </Card>
      ) : isEmpty ? (
        <Card>
          <EmptyState
            icon="receipt"
            title={tab === 'paid' ? 'Chưa có phiếu thu đã thanh toán' : 'Chưa có phiếu thu'}
            description="Phiếu thu sẽ xuất hiện sau khi khoản thanh toán được ghi nhận."
            actionLabel={tab !== 'all' ? 'Xem tất cả phiếu thu' : 'Xem lịch thanh toán'}
            onAction={() => (tab !== 'all' ? setTab('all') : router.push('/payments'))}
          />
        </Card>
      ) : tab === 'byContract' ? (
        <View style={styles.groups}>
          {groups.map((g) => (
            <View key={g.contractId} style={styles.group}>
              <View style={styles.groupHeader}>
                <Icon name="document" color={semantic.textBrand} />
                <View style={styles.flex}>
                  <Text variant="heading" accessibilityRole="header">
                    {g.contractCode}
                  </Text>
                  <Text variant="caption" color={semantic.textMuted}>
                    {g.projectName} · Căn {g.unitCode} · {g.receipts.length} phiếu
                  </Text>
                </View>
                <View style={styles.groupTotal}>
                  <Text variant="caption" color={semantic.textMuted}>
                    Đã thanh toán
                  </Text>
                  <Text variant="captionStrong" weight="bold" color={semantic.textSuccess} numeric>
                    {formatCurrency(g.paidTotal)}
                  </Text>
                </View>
              </View>
              {renderList(g.receipts, `Phiếu thu của hợp đồng ${g.contractCode}`)}
            </View>
          ))}
        </View>
      ) : (
        renderList(receipts, tab === 'paid' ? 'Phiếu thu đã thanh toán' : 'Tất cả phiếu thu')
      )}
    </Screen>
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

function TotalCard({ paidTotal, counts }: { paidTotal: number; counts: ReceiptTabCounts }) {
  return (
    <Card>
      <View style={styles.totalRow}>
        <IconCircle name="cash" tone="success" size="xl" />
        <View style={styles.flex}>
          <Text variant="caption" color={semantic.textMuted}>
            Tổng đã thanh toán · {counts.paid} phiếu
          </Text>
          <Text variant="title" color={semantic.textSuccess} numeric>
            {formatCurrency(paidTotal)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.ms },
  groups: { gap: spacing.lg },
  group: { gap: spacing.ms },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupTotal: { alignItems: 'flex-end' },
  flex: { flex: 1, minWidth: 0 },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  codeCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amount: { fontVariant: ['tabular-nums'] },
  strike: { textDecorationLine: 'line-through' },
  skeletonRow: { padding: spacing.md },
});
