import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InstallmentCard, ReceiptList, UnitFilterBar } from '@/components/domain';
import { Screen } from '@/components/layout';
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Icon,
  LineTabs,
  ScreenHeader,
  SkeletonList,
  Text,
  type DataTableColumn,
  type DataTableRow,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { usePaymentsView } from '@/hooks/usePayments';
import { formatCurrency, formatDate, formatDaysLeft, formatMonthYear } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import type { PaymentsSummary } from '@/lib/paymentsView';
import { borderWidth, colors, radius, semantic, spacing, toneColors } from '@/theme';
import type { PaymentInstallmentView } from '@/types';

/** "Cần thanh toán" = lịch thanh toán chưa trả · "Đã thanh toán" = phiếu thu. Tab nằm trên URL (`?tab=paid`) để mở thẳng từ nơi khác. */
type Tab = 'due' | 'paid';

type ColumnKey = 'name' | 'due' | 'amount' | 'status';
const columns: DataTableColumn<ColumnKey>[] = [
  { key: 'name', title: 'Đợt thanh toán', flex: 3 },
  { key: 'due', title: 'Hạn thanh toán', flex: 2.2 },
  { key: 'amount', title: 'Số tiền', flex: 2, align: 'right' },
  { key: 'status', title: 'Trạng thái', flex: 1.8 },
];

const openContract = (i: PaymentInstallmentView) => router.push({ pathname: '/contracts/[id]', params: { id: i.contractId } });

export default function PaymentsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab = params.tab === 'paid' ? 'paid' : 'due';
  const setTab = (t: Tab) => router.setParams({ tab: t });
  const [unit, setUnit] = useState<string | null>(null);
  const { isDesktop } = useBreakpoint();
  const { data, loading, refreshing, error, refetch } = usePaymentsView(unit);
  const { contractsAvailable } = useAuth();
  const shownUnit = data?.unit ?? null;

  return (
    <Screen
      onRefresh={() => void refetch()}
      refreshing={refreshing}
      top={
        <>
          <ScreenHeader title="Thanh toán" />
          {data && contractsAvailable ? <Overview summary={data.summary} /> : null}
        </>
      }
      sticky={() => (
        <>
          <LineTabs
            accessibilityLabel="Khoản thanh toán"
            items={[
              { key: 'due', label: 'Cần thanh toán', count: data?.summary.dueCount },
              { key: 'paid', label: 'Đã thanh toán', count: data?.summary.receiptCount },
            ]}
            value={tab}
            onChange={setTab}
          />
          {data ? <UnitFilterBar units={data.units} value={shownUnit} onChange={setUnit} accessibilityLabel="Lọc theo căn" /> : null}
        </>
      )}>
      {loading ? (
        <SkeletonList count={4} />
      ) : error || !data ? (
        <Card>
          <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
        </Card>
      ) : !contractsAvailable ? (
        <Card>
          <EmptyState
            icon="building"
            title="Bạn chưa có hợp đồng"
            description="Khi trúng bốc thăm và ký hợp đồng, thông tin sẽ hiển thị tại đây."
            actionLabel="Đến Nhà ở xã hội"
            onAction={() => router.navigate('/noxh')}
          />
        </Card>
      ) : tab === 'paid' ? (
        data.receipts.length === 0 ? (
          <Card>
            <EmptyState
              icon="receipt"
              title={shownUnit ? `Căn ${shownUnit} chưa có phiếu thu` : 'Chưa có phiếu thu'}
              description="Phiếu thu sẽ xuất hiện sau khi khoản thanh toán được ghi nhận."
              actionLabel={shownUnit ? 'Xem tất cả các căn' : undefined}
              onAction={() => setUnit(null)}
            />
          </Card>
        ) : (
          <ReceiptList receipts={data.receipts} accessibilityLabel={shownUnit ? `Phiếu thu căn ${shownUnit}` : 'Phiếu thu'} />
        )
      ) : data.due.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendarCheck"
            title={shownUnit ? `Căn ${shownUnit} không có khoản cần thanh toán` : 'Bạn không có khoản cần thanh toán'}
            description="Tất cả các đợt đã được thanh toán đầy đủ."
            actionLabel="Xem đã thanh toán"
            onAction={() => setTab('paid')}
          />
        </Card>
      ) : (
        <View style={styles.groups}>
          {data.dueGroups.map((g) => (
            <View key={g.key} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text variant="heading" accessibilityRole="header">
                  {formatMonthYear(`${g.key}-01`)}
                </Text>
                <Text variant="captionStrong" color={semantic.textMuted}>
                  {g.items.length} đợt · {formatCurrency(g.total)}
                </Text>
              </View>
              {isDesktop ? (
                <DataTable accessibilityLabel={`Các đợt cần thanh toán ${formatMonthYear(`${g.key}-01`)}`} columns={columns} rows={g.items.map(toRow)} />
              ) : (
                <View style={styles.list}>
                  {g.items.map((item) => (
                    <InstallmentCard key={item.id} installment={item} showContract onPress={() => openContract(item)} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

/** Thông tin chung gọn: còn phải trả | đã trả (theo căn đang lọc), thêm một dòng nhắc nếu có đợt quá hạn. */
function Overview({ summary }: { summary: PaymentsSummary }) {
  return (
    <Card padding="md">
      <View style={styles.stats}>
        <Stat label="Cần thanh toán" value={formatCurrency(summary.dueAmount)} note={`${summary.dueCount} đợt`} />
        <View style={styles.divider} />
        <Stat label="Đã thanh toán" value={formatCurrency(summary.paidTotal)} note={`${summary.receiptCount} phiếu thu`} color={semantic.textSuccess} />
      </View>
      {summary.overdueCount > 0 ? (
        <View style={styles.overdue} role="alert">
          <Icon name="alertCircle" size="sm" color={toneColors.danger.fg} />
          <Text variant="caption" weight="semibold" color={toneColors.danger.fg} style={styles.flex}>
            {summary.overdueCount} đợt quá hạn · {formatCurrency(summary.overdueAmount)}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function Stat({ label, value, note, color }: { label: string; value: string; note: string; color?: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}, ${note}`}>
      <Text variant="caption" color={semantic.textMuted}>
        {label}
      </Text>
      <Text variant="subhead" weight="bold" color={color} numeric numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" color={semantic.textMuted}>
        {note}
      </Text>
    </View>
  );
}

function toRow(i: PaymentInstallmentView): DataTableRow<ColumnKey> {
  const meta = installmentStatusMeta[i.status];
  return {
    key: i.id,
    onPress: () => openContract(i),
    accessibilityHint: `Mở hợp đồng ${i.contractCode}`,
    cells: {
      name: (
        <View>
          <Text variant="captionStrong" weight="semibold">
            {i.name}
          </Text>
          <Text variant="caption" color={semantic.textMuted} numberOfLines={2}>
            {i.contractCode} · Căn {i.unitCode}
          </Text>
        </View>
      ),
      due: (
        <View>
          <Text variant="caption">{formatDate(i.dueDate)}</Text>
          <Text variant="caption" weight="semibold" color={i.status === 'overdue' ? colors.danger[700] : semantic.textMuted}>
            {formatDaysLeft(i.daysUntilDue)}
          </Text>
        </View>
      ),
      amount: (
        <Text variant="captionStrong" weight="bold" align="right" style={styles.amount} numeric>
          {formatCurrency(i.remainingAmount)}
        </Text>
      ),
      status: <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />,
    },
  };
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  stats: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  stat: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
  divider: { width: borderWidth.hairline, backgroundColor: semantic.border },
  overdue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.ms,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: toneColors.danger.bg,
  },
  groups: { gap: spacing.lg },
  group: { gap: spacing.ms },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  list: { gap: spacing.ms },
  amount: { fontVariant: ['tabular-nums'] },
});
