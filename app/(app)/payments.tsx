import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { InstallmentCard } from '@/components/domain';
import { Screen } from '@/components/layout';
import {
  Badge,
  Card,
  Chip,
  DataTable,
  EmptyState,
  ErrorState,
  Icon,
  MoneySummaryCard,
  ScreenHeader,
  SkeletonList,
  Text,
  type DataTableColumn,
  type DataTableRow,
} from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useHover } from '@/hooks/useHover';
import { usePaymentSchedule } from '@/hooks/useInstallments';
import { formatCurrency, formatDate, formatDaysLeft, formatMonthYear, formatPercent } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { borderWidth, chipRow, colors, interactive, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { InstallmentFilter, PaymentInstallmentView } from '@/types';

const filters: { value: InstallmentFilter; label: string }[] = [
  { value: 'due', label: 'Sắp đến hạn' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'all', label: 'Tất cả' },
];

type ColumnKey = 'name' | 'due' | 'amount' | 'status';
const columns: DataTableColumn<ColumnKey>[] = [
  { key: 'name', title: 'Đợt thanh toán', flex: 3 },
  { key: 'due', title: 'Hạn / ngày trả', flex: 2.2 },
  { key: 'amount', title: 'Số tiền', flex: 2, align: 'right' },
  { key: 'status', title: 'Trạng thái', flex: 1.8 },
];

const openContract = (i: PaymentInstallmentView) => router.push({ pathname: '/contracts/[id]', params: { id: i.contractId } });

export default function PaymentsScreen() {
  const [filter, setFilter] = useState<InstallmentFilter>('due');
  const { isDesktop } = useBreakpoint();
  const { data, loading, refreshing, error, refetch } = usePaymentSchedule(filter);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Thanh toán" subtitle="Các đợt thanh toán trên tất cả hợp đồng, sắp theo ngày" />

      {data && data.overdue.length > 0 ? <OverdueAlert items={data.overdue} amount={data.summary.overdueAmount} /> : null}

      {data ? (
        <MoneySummaryCard
          header={
            <Text variant="subhead" color={semantic.onInverse} accessibilityRole="header">
              Tổng hợp thanh toán
            </Text>
          }
          totalLabel={`Cần thanh toán · ${data.summary.dueCount} đợt`}
          total={formatCurrency(data.summary.dueAmount)}
          percent={data.summary.paidPercent}
          progressLabel={`Đã thanh toán ${formatPercent(data.summary.paidPercent)} tổng các đợt`}
          stats={[
            { label: `Quá hạn · ${data.summary.overdueCount} đợt`, value: formatCurrency(data.summary.overdueAmount), accent: data.summary.overdueCount > 0 },
            { label: `Đã thanh toán · ${data.summary.paidCount} đợt`, value: formatCurrency(data.summary.paidAmount) },
          ]}
        />
      ) : null}

      <View style={chipRow} accessibilityRole="tablist">
        {filters.map((f) => (
          <Chip key={f.value} role="tab" label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </View>

      {loading ? (
        <SkeletonList count={4} />
      ) : error || !data ? (
        <Card>
          <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendarCheck"
            title={filter === 'paid' ? 'Chưa có đợt nào được thanh toán' : 'Bạn không có khoản cần thanh toán'}
            description={filter === 'paid' ? 'Các đợt đã thanh toán sẽ hiển thị tại đây.' : 'Tất cả các đợt đã được thanh toán đầy đủ.'}
            actionLabel="Xem phiếu thu"
            onAction={() => router.push('/receipts')}
          />
        </Card>
      ) : (
        <View style={styles.groups}>
          {data.groups.map((g) => (
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
                <DataTable accessibilityLabel={`Các đợt thanh toán ${formatMonthYear(`${g.key}-01`)}`} columns={columns} rows={g.items.map(toRow)} />
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

function toRow(i: PaymentInstallmentView): DataTableRow<ColumnKey> {
  const meta = installmentStatusMeta[i.status];
  const isPaid = i.status === 'paid';
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
          <Text variant="caption" color={semantic.textMuted}>
            {i.contractCode} · Căn {i.unitCode}
          </Text>
        </View>
      ),
      due: (
        <View>
          <Text variant="caption">{formatDate(isPaid && i.paidDate ? i.paidDate : i.dueDate)}</Text>
          {!isPaid ? (
            <Text variant="caption" weight="semibold" color={i.status === 'overdue' ? colors.danger[700] : semantic.textMuted}>
              {formatDaysLeft(i.daysUntilDue)}
            </Text>
          ) : null}
        </View>
      ),
      amount: (
        <Text variant="captionStrong" weight="bold" align="right" style={styles.amount} numeric>
          {formatCurrency(isPaid ? i.amount : i.remainingAmount)}
        </Text>
      ),
      status: <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />,
    },
  };
}

/** Cảnh báo quá hạn: chữ + icon (không chỉ màu), `role="alert"`, mỗi đợt mở được hợp đồng. */
function OverdueAlert({ items, amount }: { items: PaymentInstallmentView[]; amount: number }) {
  return (
    <View style={styles.alert} role="alert">
      <View style={styles.alertHeader}>
        <Icon name="alertCircle" size="lg" color={toneColors.danger.fg} accessibilityLabel="Cảnh báo" />
        <Text variant="bodyStrong" weight="bold" color={toneColors.danger.fg} style={styles.flex}>
          {items.length} đợt quá hạn · {formatCurrency(amount)}
        </Text>
      </View>
      <Text variant="caption" color={toneColors.danger.fg}>
        Vui lòng thanh toán sớm để tránh phát sinh lãi chậm trả.
      </Text>
      {items.map((i) => (
        <OverdueRow key={i.id} item={i} />
      ))}
    </View>
  );
}

function OverdueRow({ item }: { item: PaymentInstallmentView }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      onPress={() => openContract(item)}
      {...hoverProps}
      accessibilityRole="link"
      accessibilityLabel={`${item.name}, hợp đồng ${item.contractCode}, ${formatCurrency(item.remainingAmount)}, ${formatDaysLeft(item.daysUntilDue)}. Mở hợp đồng`}
      style={({ pressed }) => [styles.overdueRow, interactive, (hovered || pressed) && styles.overdueRowHover]}>
      <View style={styles.flex}>
        <Text variant="captionStrong" weight="semibold" color={toneColors.danger.fg}>
          {item.name} · {item.contractCode}
        </Text>
        <Text variant="caption" color={toneColors.danger.fg}>
          Hạn {formatDate(item.dueDate)} · {formatDaysLeft(item.daysUntilDue)}
        </Text>
      </View>
      <Text variant="captionStrong" weight="bold" color={toneColors.danger.fg} numeric>
        {formatCurrency(item.remainingAmount)}
      </Text>
      <Icon name="chevronRight" size="sm" color={toneColors.danger.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  groups: { gap: spacing.lg },
  group: { gap: spacing.ms },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  list: { gap: spacing.ms },
  amount: { fontVariant: ['tabular-nums'] },
  alert: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius['2xl'],
    backgroundColor: toneColors.danger.bg,
    borderWidth: borderWidth.hairline,
    borderColor: toneColors.danger.border,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: semantic.surface,
  },
  overdueRowHover: { backgroundColor: colors.danger[100] },
});
