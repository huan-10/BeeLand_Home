import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ContractCard, ContractCardSkeleton, UnitFilterBar } from '@/components/domain';
import { Col, Grid, Screen } from '@/components/layout';
import { Card, CompactSummary, EmptyState, ErrorState, Input, ScreenHeader, Text } from '@/components/ui';
import { summarizeContractList } from '@/lib/contract';
import { formatCurrency, formatPercent } from '@/lib/format';
import { activeUnit, filterByUnit, unitCodesOf } from '@/lib/unitFilter';
import { useAuth } from '@/contexts/AuthContext';
import { useContracts } from '@/hooks/useContracts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { semantic, spacing } from '@/theme';
import type { ColSpan } from '@/components/layout';

/** Mobile/tablet 1 cột · desktop (≥1024) 2 cột · màn rộng (≥1280) 3 cột. */
const cardSpan: ColSpan = { mobile: 12, desktop: 6, wide: 4 };
const SKELETON_COUNT = 3;

export default function ContractsScreen() {
  // Trạng thái (đang hiệu lực / đã tất toán) xem trên nhãn từng thẻ; bộ lọc chỉ còn tìm kiếm + mã căn cho gọn.
  const [unit, setUnit] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, loading, refreshing, error, refetch } = useContracts({ search: debouncedSearch });
  const { contractsAvailable } = useAuth();

  const all = data?.items ?? [];
  const units = unitCodesOf(all);
  const shownUnit = activeUnit(units, unit);
  const items = filterByUnit(all, shownUnit);
  const isFiltered = Boolean(debouncedSearch) || shownUnit !== null;
  const listSummary = summarizeContractList(items);

  const clearFilters = () => {
    setSearch('');
    setUnit(null);
  };

  return (
    <Screen
      onRefresh={() => void refetch()}
      refreshing={refreshing}
      // top={<ScreenHeader title="Hợp đồng của tôi" subtitle="Theo dõi giá trị và tiến độ thanh toán từng hợp đồng" />}
      sticky={(collapsed) => (
      <View style={styles.filters}>
        {collapsed && items.length > 0 ? (
          <CompactSummary
            label={`${listSummary.count} hợp đồng · ${formatCurrency(listSummary.totalValue)}`}
            value={`Đã trả ${formatCurrency(listSummary.paidAmount)}`}
            aside={
              <Text variant="captionStrong" weight="semibold" color={semantic.textBrand} numeric>
                {formatPercent(listSummary.paidPercent)}
              </Text>
            }
            progress={listSummary.paidPercent}
          />
        ) : null}
        <Input
          icon="search"
          placeholder="Tìm mã hợp đồng, mã căn, dự án"
          accessibilityLabel="Tìm hợp đồng theo mã hợp đồng, mã căn hoặc tên dự án"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <UnitFilterBar units={units} value={shownUnit} onChange={setUnit} accessibilityLabel="Lọc hợp đồng theo căn" />
      </View>
      )}>

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
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="document"
            title="Không tìm thấy hợp đồng"
            description={
              debouncedSearch
                ? `Không có hợp đồng nào có mã chứa "${debouncedSearch}". Kiểm tra lại mã hoặc xóa bộ lọc.`
                : `Căn ${shownUnit ?? ''} chưa có hợp đồng.`
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
  filters: { gap: spacing.sm },
});
