import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HandoverCard, HandoverScheduleCard } from '@/components/domain';
import { Col, Grid, Screen, Section } from '@/components/layout';
import { Card, EmptyState, ErrorState, ScreenHeader, SkeletonList } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useHandovers, useHandoverSchedules } from '@/hooks/useHandover';
import { splitSchedules, vnToday } from '@/lib/handover';
import { spacing } from '@/theme';

/**
 * Bàn giao căn hộ ("Quỹ bàn giao" trên web): mỗi căn một thẻ — 4 bước nhận nhà, thời gian, diện tích thực tế, tiến độ thanh toán.
 * Có buổi bàn giao sắp tới → hiện trên cùng, bấm mở Lịch bàn giao. Chỉ xem.
 */
export default function HandoverScreen() {
  const { contractsAvailable } = useAuth();
  const handovers = useHandovers();
  const schedules = useHandoverSchedules();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const goSchedule = () => router.push('/lich-ban-giao');

  const items = schedules.data?.items ?? [];
  const next = splitSchedules(items, vnToday()).upcoming[0];
  const scheduledUnits = new Set(items.map((s) => s.unitCode));
  const list = handovers.data ?? [];

  return (
    <Screen
      onRefresh={() => {
        void handovers.refetch();
        void schedules.refetch();
      }}
      refreshing={handovers.refreshing}>
      <ScreenHeader title="Bàn giao căn hộ" subtitle="Tiến trình nhận nhà của từng căn" onBack={back} />
      {next ? (
        <Section title="Lịch bàn giao sắp tới" actionLabel="Xem tất cả" onAction={goSchedule}>
          <HandoverScheduleCard schedule={next} highlight onPress={goSchedule} />
        </Section>
      ) : null}

      {handovers.loading ? (
        <SkeletonList count={2} />
      ) : handovers.error ? (
        <Card>
          <ErrorState message={handovers.error} onRetry={() => void handovers.refetch()} />
        </Card>
      ) : !contractsAvailable ? (
        <Card>
          <EmptyState
            icon="building"
            title="Bạn chưa có hợp đồng"
            description="Thông tin bàn giao sẽ hiển thị khi bạn có hợp đồng mua bán căn hộ."
            actionLabel="Đến Nhà ở xã hội"
            onAction={() => router.navigate('/noxh')}
          />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon="key"
            title="Chưa có thông tin bàn giao"
            description="Khi chủ đầu tư bắt đầu bàn giao căn hộ của bạn, tiến trình nhận nhà sẽ hiển thị tại đây."
            actionLabel={items.length ? 'Xem lịch bàn giao' : undefined}
            onAction={items.length ? goSchedule : undefined}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          <Grid gutter="md">
            {list.map((h) => (
              <Col key={h.id} span={{ mobile: 12, desktop: 6 }}>
                <HandoverCard
                  handover={h}
                  onOpenSchedule={scheduledUnits.has(h.unitCode) ? goSchedule : undefined}
                  onOpenContract={() => router.push({ pathname: '/contracts/[id]', params: { id: h.contractId } })}
                />
              </Col>
            ))}
          </Grid>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
