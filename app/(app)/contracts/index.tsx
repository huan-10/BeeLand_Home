import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ContractCard, ContractCardSkeleton } from '@/components/domain';
import { Col, Grid, Screen } from '@/components/layout';
import { Card, Chip, EmptyState, ErrorState, Input, ScreenHeader } from '@/components/ui';
import { useContracts } from '@/hooks/useContracts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { chipRow, spacing } from '@/theme';
import type { ColSpan } from '@/components/layout';
import type { ContractCounts, ContractStatus } from '@/types';

type TabValue = Extract<ContractStatus, 'active' | 'completed'> | 'all';

const tabs: { value: TabValue; label: string; countKey: keyof ContractCounts }[] = [
  { value: 'all', label: 'Tất cả', countKey: 'all' },
  { value: 'active', label: 'Đang hiệu lực', countKey: 'active' },
  { value: 'completed', label: 'Đã tất toán', countKey: 'completed' },
];

/** Mobile/tablet 1 cột · desktop (≥1024) 2 cột · màn rộng (≥1280) 3 cột. */
const cardSpan: ColSpan = { mobile: 12, desktop: 6, wide: 4 };
const SKELETON_COUNT = 3;

export default function ContractsScreen() {
  const [tab, setTab] = useState<TabValue>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, loading, refreshing, error, refetch } = useContracts({ status: tab, search: debouncedSearch });

  const counts = data?.counts;
  const items = data?.items ?? [];
  const isFiltered = Boolean(debouncedSearch) || tab !== 'all';

  const clearFilters = () => {
    setSearch('');
    setTab('all');
  };

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Hợp đồng của tôi" subtitle="Theo dõi giá trị và tiến độ thanh toán từng hợp đồng" />

      <View style={styles.filters}>
        <Input
          label="Tìm theo mã hợp đồng"
          icon="search"
          placeholder="VD: HDMB/2026/001"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {/* Tab lọc xuống dòng khi thiếu chỗ thay vì bị cắt (skill: chip collection reflow). */}
        <View style={chipRow} accessibilityRole="tablist">
          {tabs.map((t) => {
            const count = counts?.[t.countKey];
            return (
              <Chip
                key={t.value}
                role="tab"
                label={t.label}
                count={count}
                selected={tab === t.value}
                onPress={() => setTab(t.value)}
                accessibilityLabel={count === undefined ? t.label : `${t.label}, ${count} hợp đồng`}
              />
            );
          })}
        </View>
      </View>

      {loading ? (
        <Grid>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <Col key={i} span={cardSpan}>
              <ContractCardSkeleton />
            </Col>
          ))}
        </Grid>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => void refetch()} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="document"
            title="Không tìm thấy hợp đồng"
            description={
              debouncedSearch
                ? `Không có hợp đồng nào có mã chứa "${debouncedSearch}". Kiểm tra lại mã hoặc xóa bộ lọc.`
                : 'Chưa có hợp đồng nào trong mục này.'
            }
            actionLabel={isFiltered ? 'Xóa bộ lọc' : undefined}
            onAction={clearFilters}
          />
        </Card>
      ) : (
        <Grid>
          {items.map((c) => (
            <Col key={c.id} span={cardSpan}>
              <ContractCard contract={c} onPress={() => router.push({ pathname: '/contracts/[id]', params: { id: c.id } })} />
            </Col>
          ))}
        </Grid>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.ms },
});
