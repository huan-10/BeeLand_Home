import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { InstallmentTimeline, PaymentOverviewCard, ReceiptCard } from '@/components/domain';
import { Screen, Section } from '@/components/layout';
import { Badge, Card, EmptyState, ErrorState, IconCircle, InfoRow, ScreenHeader, Skeleton, Text } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useContract } from '@/hooks/useContracts';
import { useReceipts } from '@/hooks/useReceipts';
import { formatDate } from '@/lib/format';
import { contractStatusMeta, contractTypeLabels } from '@/lib/labels';
import { radius, semantic, sizes } from '@/theme';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isWide } = useBreakpoint();
  const detail = useContract(id);
  const receipts = useReceipts({ contractId: id });

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/contracts'));

  if (detail.loading) {
    return (
      <Screen>
        <ScreenHeader title="Chi tiết hợp đồng" onBack={goBack} />
        <Skeleton height={sizes.skeleton.card} radius={radius.lg} />
        <Skeleton height={sizes.skeleton.hero} radius={radius.xl} />
        <Skeleton height={sizes.skeleton.block} radius={radius.lg} />
      </Screen>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <Screen>
        <ScreenHeader title="Chi tiết hợp đồng" onBack={goBack} />
        <ErrorState message={detail.error ?? undefined} onRetry={() => void detail.refetch()} />
      </Screen>
    );
  }

  const { contract, installments } = detail.data;
  const status = contractStatusMeta[contract.status];
  const { summary } = contract;

  const infoCard = (
    <Card>
      <View className="flex-row items-center gap-ms mb-sm">
        <IconCircle name="business" tone="primary" size="xl" />
        <View className="flex-1">
          <Text variant="h3">{contract.projectName}</Text>
          <Text variant="small" color={semantic.textMuted}>
            {contract.block} · Căn {contract.unitCode}
          </Text>
        </View>
      </View>
      <InfoRow label="Loại hợp đồng" value={contractTypeLabels[contract.type].label} />
      <InfoRow label="Trạng thái" value={<Badge label={status.label} tone={status.tone} dot />} />
      <InfoRow label="Ngày ký" value={formatDate(contract.signedDate)} />
      <InfoRow label="Tầng" value={String(contract.floor)} />
      <InfoRow label="Diện tích" value={`${contract.area.toString().replace('.', ',')} m²`} />
      <InfoRow label="Chuyên viên tư vấn" value={contract.salesAgent ?? '—'} last />
    </Card>
  );

  const schedule = (
    <Section title={`Lịch thanh toán (${summary.paidInstallmentCount}/${summary.installmentCount} đợt)`}>
      <Card padding="ml">
        {installments.length > 0 ? (
          <InstallmentTimeline installments={installments} />
        ) : (
          <EmptyState icon="calendar-outline" title="Chưa có lịch thanh toán" />
        )}
      </Card>
    </Section>
  );

  const receiptSection = (
    <Section title="Phiếu thu liên quan">
      {receipts.loading ? (
        <Skeleton height={sizes.skeleton.row} radius={radius.lg} />
      ) : receipts.data && receipts.data.length > 0 ? (
        <View className="gap-sm">
          {receipts.data.map((r) => (
            <ReceiptCard key={r.id} receipt={r} onPress={() => router.push({ pathname: '/receipts/[id]', params: { id: r.id } })} />
          ))}
        </View>
      ) : (
        <Card>
          <Text variant="small" color={semantic.textMuted} align="center">
            Chưa có phiếu thu cho hợp đồng này.
          </Text>
        </Card>
      )}
    </Section>
  );

  const overview = (
    <PaymentOverviewCard
      title="Giá trị hợp đồng"
      totalValue={summary.totalValue}
      paidAmount={summary.paidAmount}
      remainingAmount={summary.remainingAmount}
      paidPercent={summary.paidPercent}
    />
  );

  return (
    <Screen onRefresh={() => void detail.refetch()} refreshing={detail.refreshing}>
      <ScreenHeader title={contract.code} subtitle={contractTypeLabels[contract.type].label} onBack={goBack} />

      {isWide ? (
        <View className="flex-row gap-ml items-start">
          <View className="flex-1 gap-ml">
            {overview}
            {infoCard}
            {receiptSection}
          </View>
          <View className="flex-1 gap-ml">{schedule}</View>
        </View>
      ) : (
        <>
          {overview}
          {infoCard}
          {schedule}
          {receiptSection}
        </>
      )}
    </Screen>
  );
}
