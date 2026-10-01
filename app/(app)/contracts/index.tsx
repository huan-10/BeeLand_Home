import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ContractCard } from '@/components/domain';
import { ResponsiveGrid, Screen } from '@/components/layout';
import { Chip, EmptyState, ErrorState, Input, ScreenHeader, SkeletonList } from '@/components/ui';
import { useContracts } from '@/hooks/useContracts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { chipRow } from '@/theme';
import type { ContractStatus } from '@/types';

const statusFilters: { value: ContractStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hiệu lực' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'completed', label: 'Đã hoàn tất' },
];

export default function ContractsScreen() {
  const [status, setStatus] = useState<ContractStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const { data, loading, refreshing, error, refetch } = useContracts({ status, search: debouncedSearch });

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Hợp đồng" subtitle="Danh sách hợp đồng và phiếu giữ chỗ của bạn" />

      <View className="gap-ms">
        <Input
          icon="search-outline"
          placeholder="Tìm theo số hợp đồng, mã căn, dự án..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipRow}>
          {statusFilters.map((f) => (
            <Chip key={f.value} label={f.label} selected={status === f.value} onPress={() => setStatus(f.value)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="Không tìm thấy hợp đồng"
          description={search ? 'Thử tìm với từ khóa khác.' : 'Chưa có hợp đồng nào ở trạng thái này.'}
          actionLabel={search || status !== 'all' ? 'Xóa bộ lọc' : undefined}
          onAction={() => {
            setSearch('');
            setStatus('all');
          }}
        />
      ) : (
        <ResponsiveGrid columns={2}>
          {data.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              onPress={() => router.push({ pathname: '/contracts/[id]', params: { id: c.id } })}
            />
          ))}
        </ResponsiveGrid>
      )}
    </Screen>
  );
}
