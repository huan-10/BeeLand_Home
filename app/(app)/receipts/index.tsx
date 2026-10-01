import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ReceiptCard } from '@/components/domain';
import { Screen } from '@/components/layout';
import { Card, Chip, EmptyState, ErrorState, IconCircle, ScreenHeader, SkeletonList, Text } from '@/components/ui';
import { useReceiptList } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/format';
import { chipRow, colors, semantic } from '@/theme';

export default function ReceiptsScreen() {
  const [year, setYear] = useState<number | 'all'>('all');
  const { receipts, years, total, loading, refreshing, error, refetch } = useReceiptList(year);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Phiếu thu" subtitle="Chứng từ các khoản bạn đã thanh toán" />

      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <Card>
            <View className="flex-row items-center gap-ms">
              <IconCircle name="cash" tone="success" size="xl" />
              <View className="flex-1">
                <Text variant="small" color={semantic.textMuted}>
                  Tổng đã thu {year === 'all' ? '' : `năm ${year}`} · {receipts.length} phiếu
                </Text>
                <Text variant="h2" color={colors.success[700]}>
                  {formatCurrency(total)}
                </Text>
              </View>
            </View>
          </Card>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipRow}>
            <Chip label="Tất cả" selected={year === 'all'} onPress={() => setYear('all')} />
            {years.map((y) => (
              <Chip key={y} label={`Năm ${y}`} selected={year === y} onPress={() => setYear(y)} />
            ))}
          </ScrollView>

          {receipts.length === 0 ? (
            <EmptyState icon="receipt-outline" title="Chưa có phiếu thu" description="Phiếu thu sẽ xuất hiện sau khi khoản thanh toán được xác nhận." />
          ) : (
            <View className="gap-ms">
              {receipts.map((r) => (
                <ReceiptCard key={r.id} receipt={r} onPress={() => router.push({ pathname: '/receipts/[id]', params: { id: r.id } })} />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
