import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandBanner, NoxhAttentionCard, UpcomingPaymentsCard } from '@/components/domain';
import { Col, Grid, Screen, Section } from '@/components/layout';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ListRow,
  QuickActions,
  Skeleton,
  SkeletonCard,
  Text,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useDashboard } from '@/hooks/useDashboard';
import { useHomeModules } from '@/hooks/useHomeModules';
import { useLatestNotifications } from '@/hooks/useNotifications';
import { useNoxhApplications, useNoxhLotteries } from '@/hooks/useNoxh';
import { useServerClock } from '@/hooks/useServerClock';
import { appModule, type AppModule } from '@/lib/appModules';
import { formatRelativeTime, formatWeekdayDate } from '@/lib/format';
import { notificationTypeMeta } from '@/lib/labels';
import { unreadLabel } from '@/lib/notification';
import { noxhAttention } from '@/lib/noxh';
import { fontSizes, radius, semantic, sizes, spacing } from '@/theme';
import type { AppNotification } from '@/types';

const NOTIFICATION_LIMIT = 3;
/** Trang chủ hiện 3 đợt quá hạn lâu nhất; còn lại xem ở Thanh toán. */
const OVERDUE_LIMIT = 3;


export default function HomeScreen() {
  const { user } = useAuth();
  const { isDesktop, isWide } = useBreakpoint();
  const homeModules = useHomeModules();
  const quickItems = homeModules.ids
    .map(appModule)
    .filter((m): m is AppModule => !!m)
    .map((m) => ({ label: m.short, icon: m.icon, onPress: () => router.push(m.href, { withAnchor: true }) }));
  const dashboard = useDashboard();
  const notifications = useLatestNotifications(NOTIFICATION_LIMIT);
  // Việc cần làm Nhà ở xã hội (cần bổ sung / bốc thăm đang mở / sắp mở trong 24 giờ). Lỗi tải → ẩn thẻ, không ảnh hưởng Trang chủ.
  const noxhApps = useNoxhApplications();
  const noxhLots = useNoxhLotteries();
  const noxhClock = useServerClock(noxhLots.data?.server_now);
  const attention = noxhAttention(noxhApps.data ?? [], noxhLots.data?.items ?? [], noxhClock.now());

  const refresh = () => {
    void dashboard.refetch();
    void notifications.refetch();
    void noxhApps.refetch();
    void noxhLots.refetch();
  };

  const openNotification = async (n: AppNotification) => {
    if (!n.read) await notifications.markRead(n.id);
    router.push(n.link ? (n.link as Href) : '/notifications', { withAnchor: true });
  };

  return (
    <Screen onRefresh={refresh} refreshing={dashboard.refreshing || notifications.refreshing}>
      <Grid gutter={isDesktop ? 'lg' : 'md'}>
        {/* Header */}
        <Col span={{ mobile: 12 }}>
          <View style={styles.header}>
            {/* Kiểu Beeland Sales: lời chào + tên lớn, nút chuông tròn trắng bên phải. */}
            <View
              style={styles.flex}
              accessible
              accessibilityRole="header"
              accessibilityLabel={`Xin chào, ${user?.fullName ?? 'Quý khách'}. ${formatWeekdayDate()}`}>
              <Text variant="caption" color={semantic.textSecondary}>
                Xin chào,
              </Text>
              <Text variant="title" style={!isWide && styles.name}>
                {user?.fullName ?? 'Quý khách'}
              </Text>
              <Text variant="caption" color={semantic.textMuted}>
                {formatWeekdayDate()}
              </Text>
            </View>
            <IconButton
              icon="bell"
              accessibilityLabel="Thông báo"
              dot={notifications.unreadCount > 0}
              dotLabel={unreadLabel(notifications.unreadCount)}
              onPress={() => router.push('/notifications')}
            />
          </View>
        </Col>

        {/* Banner thương hiệu (thẻ Tổng quan thanh toán đã bỏ — số liệu xem ở Thanh toán) */}
        <Col span={{ mobile: 12 }}>
          <BrandBanner
            title="An cư vững tâm"
            subtitle="Hợp đồng, thanh toán, bàn giao và nhà ở xã hội — tất cả trong một ứng dụng."
          />
        </Col>

        {/* 4 chức năng: một thẻ chia 4 cột */}
        <Col span={{ mobile: 12 }}>
          {/* Chức năng do khách chọn ở Cá nhân › Quản lý › Tuỳ chỉnh (lưu theo tài khoản). */}
          {homeModules.ready ? (
            <QuickActions items={quickItems} />
          ) : (
            <Skeleton height={sizes.skeleton.card} radius={radius['2xl']} />
          )}
        </Col>

        {attention ? (
          <Col span={{ mobile: 12 }}>
            <NoxhAttentionCard attention={attention} onPress={() => router.push(attention.href as Href, { withAnchor: true })} />
          </Col>
        ) : null}

        {/* Thanh toán sắp tới (việc cần làm) trước, Thông báo sau — cùng một kiểu thẻ danh sách `ListRow`. */}
        <Col span={{ mobile: 12, desktop: 6 }}>
          <Section title="Thanh toán sắp tới" actionLabel="Xem tất cả" onAction={() => router.push('/payments')}>
            {dashboard.loading ? (
              <SkeletonCard lines={4} />
            ) : dashboard.error || !dashboard.data ? (
              <Card>
                <ErrorState message={dashboard.error ?? undefined} onRetry={() => void dashboard.refetch()} />
              </Card>
            ) : (
              <UpcomingPaymentsCard
                overdue={dashboard.data.overdueInstallments}
                next={dashboard.data.nextInstallment}
                limit={OVERDUE_LIMIT}
                onOpenItem={(item) => router.push({ pathname: '/contracts/[id]', params: { id: item.contractId } })}
                onViewAll={() => router.push('/payments')}
              />
            )}
          </Section>
        </Col>

        <Col span={{ mobile: 12, desktop: 6 }}>
          <Section title="Thông báo" actionLabel="Xem tất cả" onAction={() => router.push('/notifications')}>
            {notifications.loading ? (
              <SkeletonCard lines={4} />
            ) : notifications.error ? (
              <Card>
                <ErrorState message={notifications.error} onRetry={() => void notifications.refetch()} />
              </Card>
            ) : notifications.items.length === 0 ? (
              <Card>
                <EmptyState icon="bellOff" title="Chưa có thông báo" description="Nhắc lịch thanh toán và cập nhật dự án sẽ hiển thị tại đây." />
              </Card>
            ) : (
              // Mỗi thông báo một thẻ riêng — kiểu "Booking gần đây" của beeland-app_2026.
              <View style={styles.cards}>
                {notifications.items.map((n) => {
                  const meta = notificationTypeMeta[n.type];
                  return (
                    <ListRow
                      key={n.id}
                      card
                      icon={meta.icon}
                      tone={meta.tone}
                      title={n.title}
                      subtitle={n.message}
                      footnote={formatRelativeTime(n.createdAt)}
                      aside={!n.read ? <Badge label="Mới" tone="primary" /> : undefined}
                      onPress={() => void openNotification(n)}
                      accessibilityLabel={`${n.read ? '' : 'Chưa đọc. '}${n.title}. ${n.message}. ${formatRelativeTime(n.createdAt)}`}
                    />
                  );
                })}
              </View>
            )}
          </Section>
        </Col>
      </Grid>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  name: fontSizes.headline,
  flex: { flex: 1 },
  cards: { gap: spacing.ms },
});
