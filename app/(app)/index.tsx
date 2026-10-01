import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandBanner, NextPaymentCard, NotificationItem } from '@/components/domain';
import { Col, Grid, Screen, Section } from '@/components/layout';
import {
  ActionTile,
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  IconCircle,
  MoneySummaryCard,
  Skeleton,
  SkeletonCard,
  Text,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useDashboard } from '@/hooks/useDashboard';
import { useLatestNotifications } from '@/hooks/useNotifications';
import { formatCurrency, formatDate, formatDaysLeft, formatPercent, formatWeekdayDate } from '@/lib/format';
import { unreadLabel } from '@/lib/notification';
import { colors, radius, semantic, sizes, spacing, toneColors, type IconName, type Tone } from '@/theme';
import type { AppNotification } from '@/types';

const NOTIFICATION_LIMIT = 3;

const actions: { label: string; icon: IconName; tone: Tone; href: Href }[] = [
  { label: 'Hợp đồng', icon: 'document', tone: 'primary', href: '/contracts' },
  { label: 'Thanh toán', icon: 'calendar', tone: 'info', href: '/payments' },
  { label: 'Phiếu thu', icon: 'receipt', tone: 'success', href: '/receipts' },
  { label: 'Hồ sơ', icon: 'user', tone: 'warning', href: '/profile' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDesktop, isWide } = useBreakpoint();
  const dashboard = useDashboard();
  const notifications = useLatestNotifications(NOTIFICATION_LIMIT);

  const refresh = () => {
    void dashboard.refetch();
    void notifications.refetch();
  };

  const openNotification = async (n: AppNotification) => {
    if (!n.read) await notifications.markRead(n.id);
    router.push(n.link ? (n.link as Href) : '/notifications');
  };

  return (
    <Screen onRefresh={refresh} refreshing={dashboard.refreshing || notifications.refreshing}>
      <Grid gutter={isDesktop ? 'lg' : 'md'}>
        {/* Header */}
        <Col span={{ mobile: 12 }}>
          <View style={styles.header}>
            {user ? <Avatar name={user.fullName} /> : null}
            <View style={styles.flex}>
              {isWide ? (
                <Text variant="title" accessibilityRole="header">
                  Xin chào, {user?.fullName ?? 'Quý khách'}
                </Text>
              ) : (
                // Mobile: tách lời chào để tên không bị ngắt giữa chừng; vẫn đọc liền "Xin chào, {tên}".
                <View accessible accessibilityRole="header" accessibilityLabel={`Xin chào, ${user?.fullName ?? 'Quý khách'}`}>
                  <Text variant="caption" color={semantic.textMuted}>
                    Xin chào,
                  </Text>
                  <Text variant="title">
                    {user?.fullName ?? 'Quý khách'}
                  </Text>
                </View>
              )}
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

        {/* Tổng quan thanh toán (thẻ tối) + banner thương hiệu */}
        <Col span={{ mobile: 12, desktop: 7 }}>
          {dashboard.loading ? (
            <Skeleton height={sizes.skeleton.hero} radius={radius['3xl']} />
          ) : dashboard.error || !dashboard.data ? (
            <Card>
              <ErrorState message={dashboard.error ?? undefined} onRetry={() => void dashboard.refetch()} />
            </Card>
          ) : (
            <MoneySummaryCard
              header={
                <View style={styles.overviewHeader}>
                  <Text variant="subhead" color={semantic.onInverse} accessibilityRole="header">
                    Tổng quan thanh toán
                  </Text>
                  <Text variant="caption" color={semantic.onInverseMuted}>
                    {dashboard.data.activeContractCount}/{dashboard.data.contractCount} hợp đồng đang hiệu lực
                  </Text>
                </View>
              }
              totalLabel="Tổng giá trị hợp đồng"
              total={formatCurrency(dashboard.data.totalValue)}
              percent={dashboard.data.paidPercent}
              progressLabel={`Đã thanh toán ${formatPercent(dashboard.data.paidPercent)}`}
              stats={[
                { label: 'Đã thanh toán', value: formatCurrency(dashboard.data.paidAmount) },
                { label: 'Còn lại', value: formatCurrency(dashboard.data.remainingAmount), accent: true },
              ]}
            />
          )}
        </Col>
        <Col span={{ mobile: 12, desktop: 5 }}>
          <BrandBanner
            fill={isDesktop}
            title="An cư vững tâm"
            subtitle="Theo dõi hợp đồng, lịch thanh toán và phiếu thu của bạn tại một nơi."
          />
        </Col>

        {/* 4 ô chức năng */}
        <Col span={{ mobile: 12 }}>
          <Grid gutter={isWide ? 'md' : 'sm'}>
            {actions.map((a) => (
              <Col key={a.label} span={{ mobile: 3 }}>
                <ActionTile label={a.label} icon={a.icon} tone={a.tone} compact={!isWide} onPress={() => router.push(a.href)} />
              </Col>
            ))}
          </Grid>
        </Col>

        {/* Thông báo */}
        <Col span={{ mobile: 12, desktop: 7 }}>
          <Section title="Thông báo" actionLabel="Xem tất cả" onAction={() => router.push('/notifications')}>
            {notifications.loading ? (
              <View style={styles.list}>
                {Array.from({ length: NOTIFICATION_LIMIT }).map((_, i) => (
                  <Skeleton key={i} height={sizes.skeleton.row} radius={radius.lg} />
                ))}
              </View>
            ) : notifications.error ? (
              <Card>
                <ErrorState message={notifications.error} onRetry={() => void notifications.refetch()} />
              </Card>
            ) : notifications.items.length === 0 ? (
              <Card>
                <EmptyState icon="bellOff" title="Chưa có thông báo" description="Nhắc lịch thanh toán và cập nhật dự án sẽ hiển thị tại đây." />
              </Card>
            ) : (
              <View style={styles.list}>
                {notifications.items.map((n) => (
                  <NotificationItem key={n.id} notification={n} onPress={() => void openNotification(n)} />
                ))}
              </View>
            )}
          </Section>
        </Col>

        {/* Khoản thanh toán sắp đến hạn */}
        <Col span={{ mobile: 12, desktop: 5 }}>
          <Section title="Thanh toán sắp tới" actionLabel="Lịch thanh toán" onAction={() => router.push('/payments')}>
            {dashboard.loading ? (
              <SkeletonCard lines={5} />
            ) : dashboard.error || !dashboard.data ? (
              <Card>
                <ErrorState message={dashboard.error ?? undefined} onRetry={() => void dashboard.refetch()} />
              </Card>
            ) : (
              <View style={styles.list}>
                {dashboard.data.overdueInstallments.map((item) => (
                  <Card
                    key={item.id}
                    variant="sunken"
                    radius="xl"
                    style={styles.overdue}
                    onPress={() => router.push({ pathname: '/contracts/[id]', params: { id: item.contractId } })}
                    accessibilityLabel={`Quá hạn: ${item.contractCode}, ${item.name}, ${formatCurrency(item.remainingAmount)}`}>
                    <View style={styles.row}>
                      <IconCircle name="warning" tone="danger" size="md" />
                      <View style={styles.flex}>
                        <Text variant="captionStrong" weight="semibold" color={colors.danger[700]}>
                          {item.name} · {formatDaysLeft(item.daysUntilDue)}
                        </Text>
                        <Text variant="caption" color={colors.danger[700]}>
                          {item.contractCode} · {formatCurrency(item.remainingAmount)} · hạn {formatDate(item.dueDate)}
                        </Text>
                      </View>
                      <Icon name="chevronRight" size="sm" color={colors.danger[600]} />
                    </View>
                  </Card>
                ))}
                {dashboard.data.nextInstallment ? (
                  <NextPaymentCard
                    installment={dashboard.data.nextInstallment}
                    onViewContract={() =>
                      router.push({ pathname: '/contracts/[id]', params: { id: dashboard.data?.nextInstallment?.contractId ?? '' } })
                    }
                  />
                ) : dashboard.data.overdueInstallments.length === 0 ? (
                  <Card>
                    <EmptyState icon="checkDouble" title="Không có khoản sắp đến hạn" description="Bạn đã thanh toán đầy đủ các đợt hiện tại." />
                  </Card>
                ) : null}
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
  flex: { flex: 1 },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  overdue: { backgroundColor: toneColors.danger.bg },
  overviewHeader: { gap: spacing.xs },
});
