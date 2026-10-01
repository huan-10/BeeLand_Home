import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { InstallmentCard } from '@/components/domain';
import { ResponsiveGrid, Screen } from '@/components/layout';
import { Card, Chip, EmptyState, ErrorState, IconCircle, ScreenHeader, SkeletonList, Text } from '@/components/ui';
import { usePaymentSchedule } from '@/hooks/useInstallments';
import { formatCurrency } from '@/lib/format';
import { colors, type IconName, type Tone } from '@/theme';
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {filters.map((f) => (
          <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </ScrollView>

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
        <View className="gap-3">
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
      <View className="flex-row items-center gap-3">
        <IconCircle name={icon} tone={tone} size={40} />
        <View className="flex-1">
          <Text variant="caption" color={colors.gray[500]}>
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
