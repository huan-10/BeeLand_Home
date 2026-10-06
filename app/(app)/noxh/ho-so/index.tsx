import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApplicationCard, ConnectNoxhDialog, NoxhConnectCard } from '@/components/domain';
import { Col, Grid, Screen } from '@/components/layout';
import { Card, Chip, ChipBar, EmptyState, ErrorState, ScreenHeader, SkeletonList } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNoxhApplications } from '@/hooks/useNoxh';
import { applicationFilter, type ApplicationFilter } from '@/lib/noxh';
import { spacing } from '@/theme';

const FILTERS: { value: ApplicationFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'supplement', label: 'Cần bổ sung' },
  { value: 'done', label: 'Đã xong' },
];

export default function MyApplicationsScreen() {
  const { noxhConnected, noxhNeedsConnect } = useAuth();
  const { data, loading, refreshing, error, refetch } = useNoxhApplications();
  const [filter, setFilter] = useState<ApplicationFilter>('all');
  const [connectOpen, setConnectOpen] = useState(false);
  const rows = useMemo(() => data ?? [], [data]);
  const visible = rows.filter((r) => applicationFilter(r, filter));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/noxh'));

  return (
    <Screen
      onRefresh={() => void refetch()}
      refreshing={refreshing}
      top={<ScreenHeader title="Hồ sơ của tôi" subtitle="Hồ sơ đăng ký nhà ở xã hội ở mọi chủ đầu tư" onBack={back} />}
      sticky={() => (
        <ChipBar accessibilityLabel="Lọc hồ sơ">
          {FILTERS.map((f) => {
            const count = rows.filter((r) => applicationFilter(r, f.value)).length;
            return (
              <Chip
                key={f.value}
                role="tab"
                label={f.label}
                count={count}
                accessibilityLabel={`${f.label}, ${count} hồ sơ`}
                selected={filter === f.value}
                onPress={() => setFilter(f.value)}
              />
            );
          })}
        </ChipBar>
      )}>
      {noxhConnected && noxhNeedsConnect ? <NoxhConnectCard onPress={() => setConnectOpen(true)} /> : null}
      {!noxhConnected ? (
        <NoxhConnectCard onPress={() => setConnectOpen(true)} />
      ) : loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => void refetch()} />
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon="document"
            title={rows.length === 0 ? 'Bạn chưa có hồ sơ nào' : 'Không có hồ sơ trong mục này'}
            description={rows.length === 0 ? 'Chọn một đợt đang nhận hồ sơ để bắt đầu đăng ký.' : 'Thử chọn bộ lọc khác.'}
            actionLabel={rows.length === 0 ? 'Xem đợt đang mở' : undefined}
            onAction={rows.length === 0 ? () => router.navigate('/noxh') : undefined}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          <Grid gutter="md">
            {visible.map((r) => (
              <Col key={r.id} span={{ mobile: 12, desktop: 6 }}>
                <ApplicationCard row={r} onPress={() => router.push({ pathname: '/noxh/ho-so/[id]', params: { id: r.id } })} />
              </Col>
            ))}
          </Grid>
        </View>
      )}
      <ConnectNoxhDialog visible={connectOpen} onClose={() => setConnectOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.ms },
});
