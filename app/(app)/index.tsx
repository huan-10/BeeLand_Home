import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ContractCard, NextPaymentCard, NotificationItem, PaymentOverviewCard } from '@/components/domain';
import { ResponsiveGrid, Screen, Section } from '@/components/layout';
import { Avatar, Card, EmptyState, ErrorState, Icon, IconCircle, Skeleton, SkeletonList, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useContracts } from '@/hooks/useContracts';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency, formatDate } from '@/lib/format';
import { colors, radius, toneColors, type IconName, type Tone } from '@/theme';

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
      <View className="flex-row items-center gap-3">
        {!isWide && user ? <Avatar name={user.fullName} /> : null}
        <View className="flex-1">
          <Text variant="small" color={colors.gray[500]}>
            Xin chào,
          </Text>
          <Text variant="h2" numberOfLines={1}>
            {user?.fullName ?? 'Quý khách'}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel="Thông báo"
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.gray[200],
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="notifications-outline" size={22} color={colors.gray[700]} />
          {data && data.unreadNotificationCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 4,
                borderRadius: 9,
                backgroundColor: colors.danger[500],
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: colors.white,
              }}>
              <Text variant="caption" weight="bold" color={colors.white} style={{ fontSize: 10, lineHeight: 12 }}>
                {data.unreadNotificationCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {dashboard.loading ? (
        <View className="gap-4">
          <Skeleton height={200} radius={radius.xl} />
          <Skeleton height={150} radius={radius.lg} />
        </View>
      ) : dashboard.error || !data ? (
        <ErrorState message={dashboard.error ?? undefined} onRetry={() => void dashboard.refetch()} />
      ) : (
        <>
          <ResponsiveGrid columns={2} gap={16}>
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
              style={{ backgroundColor: toneColors.danger.bg, borderColor: colors.danger[100] }}
              shadow="none">
              <View className="flex-row items-center gap-3">
                <IconCircle name="warning" tone="danger" size={40} />
                <View className="flex-1">
                  <Text variant="smallMedium" weight="semibold" color={colors.danger[700]}>
                    {item.contractCode}: {item.name} đã quá hạn
                  </Text>
                  <Text variant="caption" color={colors.danger[700]}>
                    {formatCurrency(item.remainingAmount)} · hạn {formatDate(item.dueDate)}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.danger[600]} />
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
          <View className="gap-2">
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
    <View className="flex-row gap-3">
      {quickActions.map((a) => (
        <Pressable
          key={a.label}
          onPress={() => router.push(a.href)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1,
            alignItems: 'center',
            gap: 8,
            paddingVertical: 14,
            paddingHorizontal: 4,
            borderRadius: radius.lg,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.gray[100],
            opacity: pressed ? 0.8 : 1,
          })}>
          <IconCircle name={a.icon} tone={a.tone} size={40} />
          <Text variant="caption" weight="medium" align="center" numberOfLines={2}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
