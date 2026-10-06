import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { ConnectNoxhDialog, LotteryCard, NoxhConnectCard } from '@/components/domain';
import { Col, Grid, Screen } from '@/components/layout';
import { Card, EmptyState, ErrorState, ScreenHeader, SkeletonList } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNoxhLotteries } from '@/hooks/useNoxh';
import { useJitteredRefetch, useServerClock } from '@/hooks/useServerClock';

export default function MyLotteriesScreen() {
  const { noxhConnected, noxhNeedsConnect } = useAuth();
  const { data, loading, refreshing, error, refetch } = useNoxhLotteries();
  const clock = useServerClock(data?.server_now);
  const [connectOpen, setConnectOpen] = useState(false);
  const reloadAtBoundary = useJitteredRefetch(refetch);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/noxh'));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  const items = data?.items ?? [];
  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Bốc thăm của tôi" subtitle="Lịch và kết quả bốc thăm theo giờ máy chủ" onBack={back} />
      {noxhConnected && noxhNeedsConnect ? <NoxhConnectCard onPress={() => setConnectOpen(true)} /> : null}
      {!noxhConnected ? (
        <NoxhConnectCard onPress={() => setConnectOpen(true)} />
      ) : loading ? (
        <SkeletonList count={2} />
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => void refetch()} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="trophy"
            title="Bạn chưa có lượt bốc thăm"
            description="Hồ sơ được Sở Xây dựng chấp thuận sẽ được xếp lịch bốc thăm và hiển thị tại đây."
          />
        </Card>
      ) : (
        <Grid gutter="md">
          {items.map((item) => (
            <Col key={item.bt_ho_so_id} span={{ mobile: 12, desktop: 6 }}>
              <LotteryCard
                item={item}
                now={clock.now}
                onBoundary={reloadAtBoundary}
                onPress={() => router.push({ pathname: '/noxh/boc-tham/[id]', params: { id: item.bt_ho_so_id } })}
              />
            </Col>
          ))}
        </Grid>
      )}
      <ConnectNoxhDialog visible={connectOpen} onClose={() => setConnectOpen(false)} />
    </Screen>
  );
}
