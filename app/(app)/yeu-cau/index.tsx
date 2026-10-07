import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen, StickyActionBar } from '@/components/layout';
import { Badge, Button, Card, EmptyState, ErrorState, ListRow, ScreenHeader, SkeletonList } from '@/components/ui';
import { useMyRequests } from '@/hooks/useRequests';
import { formatDate } from '@/lib/format';
import { requestStatusTone } from '@/lib/requests';
import { spacing } from '@/theme';

/**
 * Yêu cầu của tôi: mỗi yêu cầu một thẻ (kiểu "Booking gần đây") — tiêu đề · "Số phiếu · Loại" · ngày gửi | trạng thái
 * (màu do chủ đầu tư đặt trên web). Nút "Gửi yêu cầu mới" dính đáy.
 */
export default function RequestsScreen() {
  const { data, loading, refreshing, error, refetch } = useMyRequests();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const create = () => router.push('/yeu-cau/tao');
  const list = data ?? [];
  // Quay lại màn (sau khi gửi / xem chi tiết) → tải lại để thấy yêu cầu mới và phản hồi mới; lần đầu đã tải sẵn.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );

  return (
    <Screen
      onRefresh={() => void refetch()}
      refreshing={refreshing}
      footer={
        <StickyActionBar>
          <Button title="Gửi yêu cầu mới" leftIcon="message" fullWidth onPress={create} />
        </StickyActionBar>
      }>
      <ScreenHeader title="Yêu cầu của tôi" subtitle="Gửi phản ánh, đề nghị và theo dõi phản hồi" onBack={back} />
      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => void refetch()} />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon="message"
            title="Bạn chưa gửi yêu cầu nào"
            description="Cần sửa chữa, hỏi về hợp đồng, thanh toán hay bàn giao? Gửi yêu cầu, chủ đầu tư sẽ phản hồi tại đây."
            actionLabel="Gửi yêu cầu"
            onAction={create}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {list.map((r) => (
            <ListRow
              key={r.id}
              card
              icon="message"
              tone={requestStatusTone(r.status, r.statusColor)}
              title={r.title}
              titleLines={2}
              subtitle={[r.code, r.category].filter(Boolean).join(' · ') || 'Yêu cầu'}
              footnote={`Gửi ${formatDate(r.createdAt)}`}
              aside={<Badge label={r.status} tone={requestStatusTone(r.status, r.statusColor)} />}
              onPress={() => router.push({ pathname: '/yeu-cau/[id]', params: { id: r.id } })}
              accessibilityLabel={`${r.title}, ${r.code}, ${r.status}, gửi ${formatDate(r.createdAt)}`}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.ms },
});
