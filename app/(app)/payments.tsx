import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { InstallmentCard } from '@/components/domain';
import { ResponsiveGrid, Screen } from '@/components/layout';
import { Card, Chip, EmptyState, ErrorState, IconCircle, ScreenHeader, SkeletonList, Text } from '@/components/ui';
import { usePaymentSchedule } from '@/hooks/useInstallments';
import { formatCurrency } from '@/lib/format';
import { chipRow, semantic, type IconName, type Tone } from '@/theme';
import type { InstallmentFilter } from '@/types';

const filters: { value: InstallmentFilter; label: string }[] = [
  { value: 'due', label: 'Cần thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'all', label: 'Tất cả' },
];

export default function PaymentsScreen() {
  const [filter, setFilter] = useState<InstallmentFilter>('due');
  const { data, loading, refreshing, error, refetch } = usePaymentSchedule(filter);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Thanh toán" subtitle="Lịch thanh toán trên tất cả hợp đồng" />

      {data ? (
        <ResponsiveGrid columns={3}>
          <StatCard icon="wallet" tone="primary" label="Cần thanh toán" value={formatCurrency(data.summary.dueAmount)} hint={`${data.summary.dueCount} đợt`} />
          <StatCard icon="warning" tone="danger" label="Quá hạn" value={formatCurrency(data.summary.overdueAmount)} hint={`${data.summary.overdueCount} đợt`} />
          <StatCard icon="checkmark-circle" tone="success" label="Đã thanh toán" value={formatCurrency(data.summary.paidAmount)} hint={`${data.summary.paidCount} đợt`} />
        </ResponsiveGrid>
      ) : null}

      <View style={chipRow} accessibilityRole="tablist">
        {filters.map((f) => (
          <Chip role="tab" key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </View>

      {loading ? (
        <SkeletonList count={4} />
      ) : error || !data ? (
        <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="calendar-clear-outline"
          title={filter === 'paid' ? 'Chưa có đợt nào được thanh toán' : 'Bạn không có khoản cần thanh toán'}
        />
      ) : (
        <View className="gap-ms">
          {data.items.map((item) => (
            <InstallmentCard
              key={item.id}
              installment={item}
              showContract
              onPress={() => router.push({ pathname: '/contracts/[id]', params: { id: item.contractId } })}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function StatCard({ icon, tone, label, value, hint }: { icon: IconName; tone: Tone; label: string; value: string; hint: string }) {
  return (
    <Card>
      <View className="flex-row items-center gap-ms">
        <IconCircle name={icon} tone={tone} size="md" />
        <View className="flex-1">
          <Text variant="caption" color={semantic.textMuted}>
            {label} · {hint}
          </Text>
          <Text variant="bodyMedium" weight="bold" numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
        </View>
      </View>
    </Card>
  );
}
