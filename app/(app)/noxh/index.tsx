import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import {
  ConnectNoxhDialog,
  LotteryHighlightCard,
  NoxhConnectCard,
  NoxhInviteCard,
  NoxhStatusCard,
  RoundCard,
} from '@/components/domain';
import { Col, Grid, Screen, Section } from '@/components/layout';
import { Button, Card, EmptyState, ErrorState, IconButton, IconCircle, QuickActions, ScreenHeader, Skeleton, Text, TextLink } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useLatestNotifications } from '@/hooks/useNotifications';
import { useNoxhApplications, useNoxhLotteries, useNoxhRounds } from '@/hooks/useNoxh';
import { useJitteredRefetch, useServerClock } from '@/hooks/useServerClock';
import { unreadLabel } from '@/lib/notification';
import { applicationNote, lotteryPhase, pickFeaturedApplication, pickLotteryHighlight, upcomingRounds } from '@/lib/noxh';
import { radius, sizes, spacing, type IconName } from '@/theme';
import type { NoxhApplicationRow, NoxhLotteryItem } from '@/types';

const tiles: { label: string; icon: IconName; href: Href }[] = [
  { label: 'Hồ sơ\ncủa tôi', icon: 'document', href: '/noxh/ho-so' },
  { label: 'Bốc thăm', icon: 'trophy', href: '/noxh/boc-tham' },
  { label: 'Kết quả', icon: 'listChecks', href: '/noxh/ket-qua' },
  { label: 'Hướng dẫn', icon: 'book', href: '/noxh/huong-dan' },
];

const PROCESS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'user', title: 'Đăng nhập', text: 'Dùng tài khoản ứng dụng hiện có.' },
  { icon: 'document', title: 'Nộp hồ sơ', text: 'Chọn đợt, khai thông tin, tải giấy tờ.' },
  { icon: 'shieldCheck', title: 'Xác minh', text: 'Chủ đầu tư và Sở Xây dựng xét duyệt.' },
  { icon: 'trophy', title: 'Bốc thăm', text: 'Tự bốc thăm căn hộ online.' },
];

export default function NoxhHomeScreen() {
  const { noxhConnected, noxhNeedsConnect } = useAuth();
  const { isDesktop } = useBreakpoint();
  const reduceMotion = useReducedMotion();
  const rounds = useNoxhRounds();
  const apps = useNoxhApplications();
  const lotteries = useNoxhLotteries();
  const notifications = useLatestNotifications(1);
  const clock = useServerClock(lotteries.data?.server_now);
  const reloadLotteriesAtBoundary = useJitteredRefetch(lotteries.refetch);
  const [connectOpen, setConnectOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const roundsY = useRef(0);

  const refresh = () => {
    void rounds.refetch();
    void apps.refetch();
    void lotteries.refetch();
  };

  const visibleRounds = upcomingRounds(rounds.data ?? []);
  const openCount = visibleRounds.filter((r) => r.tinh_trang === 'DANG_MO').length;
  const featured = pickFeaturedApplication(apps.data ?? []);
  const highlight = pickLotteryHighlight(lotteries.data?.items ?? [], clock.now());
  const scrollToRounds = () => scrollRef.current?.scrollTo({ y: roundsY.current, animated: !reduceMotion });

  return (
    <Screen onRefresh={refresh} refreshing={rounds.refreshing || apps.refreshing} scrollRef={scrollRef}>
      <ScreenHeader
        title="Nhà ở xã hội"
        subtitle="Đăng ký, theo dõi hồ sơ và bốc thăm"
        right={
          <IconButton
            icon="bell"
            accessibilityLabel="Thông báo"
            dot={notifications.unreadCount > 0}
            dotLabel={unreadLabel(notifications.unreadCount)}
            onPress={() => router.push('/notifications')}
          />
        }
      />

      {noxhConnected && noxhNeedsConnect ? <NoxhConnectCard onPress={() => setConnectOpen(true)} /> : null}
      <Grid gutter={isDesktop ? 'lg' : 'md'}>
        {/* Thẻ chính: hồ sơ cần chú ý nhất / lời mời đăng ký / kết nối NOXH (desktop: chừa cột phải khi có bốc thăm). */}
        <Col span={{ mobile: 12, desktop: highlight ? 7 : 12 }}>
          {!noxhConnected ? (
            <NoxhConnectCard onPress={() => setConnectOpen(true)} />
          ) : apps.loading ? (
            <Skeleton height={sizes.skeleton.hero} radius={radius['3xl']} />
          ) : apps.error ? (
            <Card>
              <ErrorState message={apps.error} onRetry={() => void apps.refetch()} />
            </Card>
          ) : featured ? (
            <FeaturedApplication row={featured} lotteries={lotteries.data?.items ?? []} now={clock.now()} />
          ) : (
            <NoxhInviteCard openRounds={openCount} onPress={scrollToRounds} />
          )}
        </Col>

        {/* Bên phải (desktop) / ngay dưới (mobile): lượt bốc thăm nổi bật. */}
        {highlight ? (
          <Col span={{ mobile: 12, desktop: 5 }}>
            <LotteryHighlightCard
              item={highlight}
              now={clock.now}
              onPress={() => router.push({ pathname: '/noxh/boc-tham/[id]', params: { id: highlight.bt_ho_so_id } })}
              onBoundary={reloadLotteriesAtBoundary}
            />
          </Col>
        ) : null}

        <Col span={{ mobile: 12 }}>
          <QuickActions items={tiles.map((t) => ({ label: t.label, icon: t.icon, onPress: () => router.push(t.href) }))} />
        </Col>

        {/* Quy trình 4 bước chỉ cho khách chưa có hồ sơ (đã có hồ sơ → ô Hướng dẫn). */}
        {noxhConnected && !apps.loading && !featured ? (
          <Col span={{ mobile: 12 }}>
            <ProcessCard />
          </Col>
        ) : null}

        <Col span={{ mobile: 12 }}>
          <View
            onLayout={(e) => {
              roundsY.current = e.nativeEvent.layout.y;
            }}>
            <Section title="Đợt đang nhận hồ sơ">
              {rounds.loading ? (
                <Grid gutter="md">
                  {[0, 1].map((i) => (
                    <Col key={i} span={{ mobile: 12, tablet: 6 }}>
                      <Skeleton height={sizes.skeleton.block} radius={radius['3xl']} />
                    </Col>
                  ))}
                </Grid>
              ) : rounds.error ? (
                <Card>
                  <ErrorState message={rounds.error} onRetry={() => void rounds.refetch()} />
                </Card>
              ) : visibleRounds.length === 0 ? (
                <Card>
                  <EmptyState icon="calendar" title="Hiện chưa có đợt nhận hồ sơ" description="Đợt mới của chủ đầu tư sẽ hiển thị tại đây." />
                </Card>
              ) : (
                <Grid gutter="md">
                  {visibleRounds.map((r) => (
                    <Col key={r.id} span={{ mobile: 12, tablet: 6, desktop: 4 }}>
                      <RoundCard round={r} now={clock.now()} onPress={() => router.push({ pathname: '/noxh/dot/[id]', params: { id: r.id } })} />
                    </Col>
                  ))}
                </Grid>
              )}
            </Section>
          </View>
        </Col>
      </Grid>

      <ConnectNoxhDialog visible={connectOpen} onClose={() => setConnectOpen(false)} />
    </Screen>
  );
}

/** Thẻ ink của hồ sơ cần chú ý nhất + nút hành động theo trạng thái. */
function FeaturedApplication({ row, lotteries, now }: { row: NoxhApplicationRow; lotteries: NoxhLotteryItem[]; now: number }) {
  const lot = lotteries.find((l) => l.so_ho_so === row.so_ho_so);
  const lotteryOpen = !!lot && lotteryPhase(lot, now) === 'open';
  const openApp = () => router.push({ pathname: '/noxh/ho-so/[id]', params: { id: row.id } });
  const action =
    row.trang_thai === 'CAN_BO_SUNG'
      ? { title: 'Bổ sung ngay', onPress: () => router.push({ pathname: '/noxh/ho-so/[id]/giay-to', params: { id: row.id } }) }
      : row.trang_thai === 'NHAP'
        ? { title: 'Tiếp tục hồ sơ', onPress: openApp }
        : lotteryOpen && lot
          ? { title: 'Vào bốc thăm', onPress: () => router.push({ pathname: '/noxh/boc-tham/[id]', params: { id: lot.bt_ho_so_id } }) }
          : { title: 'Xem hồ sơ', onPress: openApp };
  return (
    <NoxhStatusCard
      row={row}
      lotteryDone={!!lot?.da_quay}
      note={lotteryOpen ? 'Đang mở bốc thăm — vào bốc thăm ngay' : (applicationNote(row) ?? undefined)}
      footer={
        <>
          <Button title={action.title} variant="secondary" rightIcon="arrowRight" onPress={action.onPress} />
          {action.title !== 'Xem hồ sơ' ? <Button title="Xem hồ sơ" variant="inverse" onPress={openApp} /> : null}
        </>
      }
    />
  );
}

/** Quy trình 4 bước — một hàng ngang gọn (icon + tên bước) và lối tắt "Xem hướng dẫn". */
function ProcessCard() {
  return (
    <Card padding="md">
      <View style={styles.processHead}>
        <Text variant="subhead" accessibilityRole="header" style={styles.flex}>
          Quy trình 4 bước
        </Text>
        <TextLink label="Xem hướng dẫn" onPress={() => router.push('/noxh/huong-dan')} />
      </View>
      <View style={styles.process} role="list">
        {PROCESS.map((p, i) => (
          <View key={p.title} style={styles.processStep} role="listitem" accessible accessibilityLabel={`Bước ${i + 1}: ${p.title}. ${p.text}`}>
            <IconCircle name={p.icon} tone="primary" size="md" />
            <Text variant="label" weight="medium" align="center" style={styles.processLabel}>
              {i + 1}. {p.title}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  processHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  process: { flexDirection: 'row', marginTop: spacing.ms },
  processStep: { flex: 1, alignItems: 'center', gap: spacing.xs },
  processLabel: { letterSpacing: 0 },
  flex: { flex: 1, minWidth: 0 },
});
