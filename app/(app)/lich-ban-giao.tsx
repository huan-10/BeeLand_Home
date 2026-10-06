import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { HandoverScheduleCard } from '@/components/domain';
import { Screen } from '@/components/layout';
import { Button, Card, EmptyState, ErrorState, IconCircle, LineTabs, ScreenHeader, SkeletonList, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useHandoverSchedules } from '@/hooks/useHandover';
import { splitSchedules, vnToday } from '@/lib/handover';
import { semantic, spacing } from '@/theme';

type Tab = 'upcoming' | 'past';

/**
 * Lịch bàn giao ("Lịch bàn giao" trên web) — CHỈ XEM: Sắp tới (gần nhất trước, buổi đầu tô đậm) | Đã qua.
 * Muốn đổi lịch → gọi hotline chủ đầu tư (xác nhận / xin đổi lịch trong app làm sau).
 */
export default function HandoverScheduleScreen() {
  const { contractsAvailable } = useAuth();
  const { data, loading, refreshing, error, refetch } = useHandoverSchedules();
  const [tab, setTab] = useState<Tab>('upcoming');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const { upcoming, past } = splitSchedules(data?.items ?? [], vnToday());
  const list = tab === 'upcoming' ? upcoming : past;
  const hotline = data?.hotline ?? '';
  const call = () => void Linking.openURL(`tel:${hotline.replace(/[^\d+]/g, '')}`);

  return (
    <Screen
      onRefresh={() => void refetch()}
      refreshing={refreshing}
      top={<ScreenHeader title="Lịch bàn giao" subtitle="Ngày giờ nhận bàn giao căn hộ của bạn" onBack={back} />}
      sticky={() => (
        <LineTabs
          accessibilityLabel="Lịch bàn giao"
          items={[
            { key: 'upcoming', label: 'Sắp tới', count: data ? upcoming.length : undefined },
            { key: 'past', label: 'Đã qua', count: data ? past.length : undefined },
          ]}
          value={tab}
          onChange={setTab}
        />
      )}>
      {loading ? (
        <SkeletonList count={3} />
      ) : error || !data ? (
        <Card>
          <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
        </Card>
      ) : !contractsAvailable ? (
        <Card>
          <EmptyState icon="building" title="Bạn chưa có hợp đồng" description="Lịch bàn giao sẽ hiển thị khi bạn có hợp đồng mua bán căn hộ." />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendarCheck"
            title={tab === 'upcoming' ? 'Chưa có lịch bàn giao sắp tới' : 'Chưa có buổi bàn giao nào đã qua'}
            description={
              tab === 'upcoming'
                ? 'Chủ đầu tư sẽ lên lịch và thông báo ngày giờ nhận bàn giao căn hộ cho bạn.'
                : 'Các buổi bàn giao đã diễn ra hoặc đã hoãn sẽ hiển thị tại đây.'
            }
            actionLabel={tab === 'upcoming' && past.length ? 'Xem lịch đã qua' : undefined}
            onAction={() => setTab('past')}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {list.map((s, i) => (
            <HandoverScheduleCard key={s.id} schedule={s} highlight={tab === 'upcoming' && i === 0} />
          ))}
        </View>
      )}

      {data && hotline ? (
        <Card>
          <View style={styles.help}>
            <IconCircle name="phone" tone="primary" size="lg" />
            <View style={styles.flex}>
              <Text variant="subhead">Cần đổi lịch bàn giao?</Text>
              <Text variant="caption" color={semantic.textMuted}>
                Liên hệ chủ đầu tư để được sắp xếp lại ngày giờ phù hợp.
              </Text>
            </View>
          </View>
          <Button title={`Gọi ${hotline}`} leftIcon="phone" variant="secondary" fullWidth onPress={call} accessibilityHint="Gọi hotline chủ đầu tư" />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.ms },
  help: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, marginBottom: spacing.md },
  flex: { flex: 1, minWidth: 0 },
});
