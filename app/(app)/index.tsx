import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ContractCard, NextPaymentCard, NotificationItem, PaymentOverviewCard } from '@/components/domain';
import { ResponsiveGrid, Screen, Section } from '@/components/layout';
import { Avatar, Card, EmptyState, ErrorState, Icon, IconButton, IconCircle, Skeleton, SkeletonList, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useContracts } from '@/hooks/useContracts';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  borderWidth,
  colors,
  interactive,
  opacity,
  radius,
  semantic,
  sizes,
  spacing,
  toneColors,
  type IconName,
  type Tone,
} from '@/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isWide } = useBreakpoint();
  const dashboard = useDashboard();
  const contracts = useContracts();

  const refresh = () => {
    void dashboard.refetch();
    void contracts.refetch();
  };

  const data = dashboard.data;

  return (
    <Screen onRefresh={refresh} refreshing={dashboard.refreshing || contracts.refreshing}>
      {/* Lời chào + chuông thông báo */}
      <View className="flex-row items-center gap-ms">
        {!isWide && user ? <Avatar name={user.fullName} /> : null}
        <View className="flex-1">
          <Text variant="small" color={semantic.textMuted}>
            Xin chào,
          </Text>
          <Text variant="h2" numberOfLines={1}>
            {user?.fullName ?? 'Quý khách'}
          </Text>
        </View>
        <IconButton
          icon="notifications-outline"
          accessibilityLabel="Thông báo"
          badgeCount={data?.unreadNotificationCount}
          onPress={() => router.push('/notifications')}
        />
      </View>

      {dashboard.loading ? (
        <View className="gap-md">
          <Skeleton height={sizes.skeleton.hero} radius={radius.xl} />
          <Skeleton height={sizes.skeleton.card} radius={radius.lg} />
        </View>
      ) : dashboard.error || !data ? (
        <ErrorState message={dashboard.error ?? undefined} onRetry={() => void dashboard.refetch()} />
      ) : (
        <>
          <ResponsiveGrid columns={2} gap={spacing.md}>
            <PaymentOverviewCard
              title={`Tổng giá trị ${data.contractCount} hợp đồng`}
              totalValue={data.totalValue}
              paidAmount={data.paidAmount}
              remainingAmount={data.remainingAmount}
              paidPercent={data.paidPercent}
            />
            {data.nextInstallment ? (
              <NextPaymentCard
                installment={data.nextInstallment}
                onViewContract={() =>
                  router.push({ pathname: '/contracts/[id]', params: { id: data.nextInstallment?.contractId ?? '' } })
                }
              />
            ) : (
              <Card>
                <EmptyState icon="checkmark-done-outline" title="Không có khoản sắp đến hạn" />
              </Card>
            )}
          </ResponsiveGrid>

          {data.overdueInstallments.map((item) => (
            <Card
              key={item.id}
              onPress={() => router.push({ pathname: '/contracts/[id]', params: { id: item.contractId } })}
              style={styles.overdueCard}
              shadow="none">
              <View className="flex-row items-center gap-ms">
                <IconCircle name="warning" tone="danger" size="md" />
                <View className="flex-1">
                  <Text variant="smallMedium" weight="semibold" color={colors.danger[700]}>
                    {item.contractCode}: {item.name} đã quá hạn
                  </Text>
                  <Text variant="caption" color={colors.danger[700]}>
                    {formatCurrency(item.remainingAmount)} · hạn {formatDate(item.dueDate)}
                  </Text>
                </View>
                <Icon name="chevron-forward" size="sm" color={colors.danger[600]} />
              </View>
            </Card>
          ))}

          <QuickActions />
        </>
      )}

      <Section title="Hợp đồng của tôi" actionLabel="Xem tất cả" onAction={() => router.push('/contracts')}>
        {contracts.loading ? (
          <SkeletonList count={2} />
        ) : contracts.error ? (
          <ErrorState message={contracts.error} onRetry={() => void contracts.refetch()} />
        ) : contracts.data && contracts.data.length > 0 ? (
          <ResponsiveGrid columns={2}>
            {contracts.data.slice(0, isWide ? 4 : 2).map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                onPress={() => router.push({ pathname: '/contracts/[id]', params: { id: c.id } })}
              />
            ))}
          </ResponsiveGrid>
        ) : (
          <EmptyState title="Chưa có hợp đồng" description="Hợp đồng của bạn sẽ hiển thị tại đây." />
        )}
      </Section>

      {data && data.latestNotifications.length > 0 ? (
        <Section title="Thông báo mới" actionLabel="Tất cả" onAction={() => router.push('/notifications')}>
          <View className="gap-sm">
            {data.latestNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onPress={() => (n.link ? router.push(n.link as Href) : router.push('/notifications'))}
              />
            ))}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}

const quickActions: { label: string; icon: IconName; tone: Tone; href: Href }[] = [
  { label: 'Hợp đồng', icon: 'document-text', tone: 'primary', href: '/contracts' },
  { label: 'Lịch thanh toán', icon: 'calendar', tone: 'info', href: '/payments' },
  { label: 'Phiếu thu', icon: 'receipt', tone: 'success', href: '/receipts' },
  { label: 'Thông báo', icon: 'notifications', tone: 'warning', href: '/notifications' },
];

function QuickActions() {
  return (
    <View className="flex-row gap-ms">
      {quickActions.map((a) => (
        <Pressable
          key={a.label}
          onPress={() => router.push(a.href)}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          style={({ pressed }) => [styles.quickAction, interactive, pressed && styles.pressed]}>
          <IconCircle name={a.icon} tone={a.tone} size="md" />
          <Text variant="caption" weight="medium" align="center" numberOfLines={2}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overdueCard: { backgroundColor: toneColors.danger.bg, borderColor: toneColors.danger.border },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: semantic.surface,
    borderWidth: borderWidth.hairline,
    borderColor: semantic.borderSubtle,
  },
  pressed: { opacity: opacity.pressed },
});
