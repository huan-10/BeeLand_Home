import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HandoverCard } from '@/components/domain';
import { Col, Grid, Screen } from '@/components/layout';
import { Button, Card, Dialog, EmptyState, ErrorState, ScreenHeader, SkeletonList, Text, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useHandoverOverview } from '@/hooks/useHandover';
import { dayMonth } from '@/lib/handover';
import { cancelHandover } from '@/services';
import { getErrorMessage } from '@/services/errors';
import type { HandoverOverviewItem, HandoverSchedule } from '@/types';
import { semantic, spacing } from '@/theme';

/**
 * Bàn giao căn hộ ("Quỹ bàn giao" + "Lịch bàn giao" trên web, gộp 2026-10-16): mỗi căn một thẻ — 4 bước nhận nhà,
 * khối "Lịch nhận nhà" (khách tự chọn ngày + ca trong khoảng bàn giao, đổi / huỷ khi còn chờ xác nhận), diện tích, tiến độ thanh toán.
 */
export default function HandoverScreen() {
  const { contractsAvailable } = useAuth();
  const toast = useToast();
  const { data, loading, refreshing, error, refetch } = useHandoverOverview();
  const [cancelling, setCancelling] = useState<HandoverSchedule | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Quay lại từ màn chọn lịch → tải lại để thấy lịch vừa đăng ký / đổi; lần đầu đã tải sẵn.
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

  const list = data?.items ?? [];
  const hotline = data?.hotline ?? '';

  const book = (h: HandoverOverviewItem) => router.push({ pathname: '/ban-giao/chon-lich', params: { id: h.id } });
  const reschedule = (h: HandoverOverviewItem, s: HandoverSchedule) =>
    router.push({ pathname: '/ban-giao/chon-lich', params: { id: h.id, lich: s.id, ngay: s.date, ca: s.shiftId ?? '' } });

  const confirmCancel = async () => {
    if (!cancelling || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await cancelHandover(cancelling.id);
      setCancelling(null);
      toast.show('Đã huỷ lịch nhận nhà', 'success');
      await refetch();
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Bàn giao căn hộ" subtitle="Tiến trình và lịch nhận nhà của từng căn" onBack={back} />

      {loading ? (
        <SkeletonList count={2} />
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={() => void refetch()} />
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
            description="Khi chủ đầu tư bắt đầu bàn giao căn hộ của bạn, tiến trình và lịch nhận nhà sẽ hiển thị tại đây."
          />
        </Card>
      ) : (
        <View style={styles.list}>
          <Grid gutter="md">
            {list.map((h) => (
              <Col key={h.id} span={{ mobile: 12, desktop: 6 }}>
                <HandoverCard
                  handover={h}
                  hotline={hotline}
                  onBook={() => book(h)}
                  onReschedule={(s) => reschedule(h, s)}
                  onCancel={setCancelling}
                  onOpenContract={() => router.push({ pathname: '/contracts/[id]', params: { id: h.contractId } })}
                />
              </Col>
            ))}
          </Grid>
        </View>
      )}

      <Dialog
        visible={cancelling !== null}
        title={`Huỷ lịch nhận nhà ngày ${cancelling ? dayMonth(cancelling.date) : ''}?`}
        onClose={() => (busy ? undefined : setCancelling(null))}
        actions={
          <>
            <Button title="Giữ lịch" variant="ghost" onPress={() => setCancelling(null)} disabled={busy} />
            <Button title="Huỷ lịch" variant="danger" leftIcon="closeCircle" loading={busy} onPress={() => void confirmCancel()} />
          </>
        }>
        <Text variant="body" color={semantic.textSecondary}>
          Bạn có thể chọn lại ngày khác trong thời gian bàn giao sau khi huỷ.
        </Text>
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
