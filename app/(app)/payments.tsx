import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { InstallmentCard } from '@/components/domain';
import { Col, Grid, Screen } from '@/components/layout';
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
  SkeletonList,
  Text,
  type DataTableColumn,
  type DataTableRow,
} from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useHover } from '@/hooks/useHover';
import { usePaymentSchedule } from '@/hooks/useInstallments';
import { formatCurrency, formatDate, formatDaysLeft, formatMonthYear } from '@/lib/format';
import { installmentStatusMeta } from '@/lib/labels';
import { borderWidth, chipRow, colors, interactive, radius, semantic, sizes, spacing, toneColors, type IconName, type Tone } from '@/theme';
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
        <Grid>
          <Col span={{ mobile: 12, desktop: 4 }}>
            <StatCard icon="wallet" tone="primary" label="Cần thanh toán" value={formatCurrency(data.summary.dueAmount)} hint={`${data.summary.dueCount} đợt`} />
          </Col>
          <Col span={{ mobile: 12, desktop: 4 }}>
            <StatCard icon="warning" tone="danger" label="Quá hạn" value={formatCurrency(data.summary.overdueAmount)} hint={`${data.summary.overdueCount} đợt`} />
          </Col>
          <Col span={{ mobile: 12, desktop: 4 }}>
            <StatCard icon="checkmark-circle" tone="success" label="Đã thanh toán" value={formatCurrency(data.summary.paidAmount)} hint={`${data.summary.paidCount} đợt`} />
          </Col>
        </Grid>
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
            icon="calendar-clear-outline"
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
                <Text variant="h3" accessibilityRole="header">
                  {formatMonthYear(`${g.key}-01`)}
                </Text>
                <Text variant="smallMedium" color={semantic.textMuted}>
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
          <Text variant="smallMedium" weight="semibold">
            {i.name}
          </Text>
          <Text variant="caption" color={semantic.textMuted}>
            {i.contractCode} · Căn {i.unitCode}
          </Text>
        </View>
      ),
      due: (
        <View>
          <Text variant="small">{formatDate(isPaid && i.paidDate ? i.paidDate : i.dueDate)}</Text>
          {!isPaid ? (
            <Text variant="caption" weight="semibold" color={i.status === 'overdue' ? colors.danger[700] : semantic.textMuted}>
              {formatDaysLeft(i.daysUntilDue)}
            </Text>
          ) : null}
        </View>
      ),
      amount: (
        <Text variant="smallMedium" weight="bold" align="right" style={styles.amount}>
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
        <Icon name="alert-circle" size="lg" color={toneColors.danger.fg} accessibilityLabel="Cảnh báo" />
        <Text variant="bodyMedium" weight="bold" color={toneColors.danger.fg} style={styles.flex}>
          {items.length} đợt quá hạn · {formatCurrency(amount)}
        </Text>
      </View>
      <Text variant="small" color={toneColors.danger.fg}>
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
        <Text variant="smallMedium" weight="semibold" color={toneColors.danger.fg}>
          {item.name} · {item.contractCode}
        </Text>
        <Text variant="caption" color={toneColors.danger.fg}>
          Hạn {formatDate(item.dueDate)} · {formatDaysLeft(item.daysUntilDue)}
        </Text>
      </View>
      <Text variant="smallMedium" weight="bold" color={toneColors.danger.fg}>
        {formatCurrency(item.remainingAmount)}
      </Text>
      <Icon name="chevron-forward" size="sm" color={toneColors.danger.fg} />
    </Pressable>
  );
}

function StatCard({ icon, tone, label, value, hint }: { icon: IconName; tone: Tone; label: string; value: string; hint: string }) {
  return (
    <Card style={styles.stat}>
      <View style={styles.statRow}>
        <IconCircle name={icon} tone={tone} size="md" />
        <View style={styles.flex}>
          <Text variant="caption" color={semantic.textMuted}>
            {label} · {hint}
          </Text>
          <Text variant="bodyMedium" weight="bold" style={styles.amount}>
            {value}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  groups: { gap: spacing.lg },
  group: { gap: spacing.ms },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  list: { gap: spacing.ms },
  amount: { fontVariant: ['tabular-nums'] },
  stat: { flex: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  alert: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
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
    borderRadius: radius.md,
    backgroundColor: semantic.surface,
  },
  overdueRowHover: { backgroundColor: colors.danger[100] },
});
