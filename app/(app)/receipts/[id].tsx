import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Logo, Screen } from '@/components/layout';
import { Badge, Button, Card, ErrorState, InfoRow, ScreenHeader, Skeleton, Text } from '@/components/ui';
import { useReceipt } from '@/hooks/useReceipts';
import { formatCurrency, formatDate } from '@/lib/format';
import { paymentMethodLabels } from '@/lib/labels';
import { colors, radius } from '@/theme';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: receipt, loading, error, refetch } = useReceipt(id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/receipts'));

  return (
    <Screen>
      <ScreenHeader title={receipt?.code ?? 'Phiếu thu'} subtitle="Chi tiết phiếu thu" onBack={goBack} />

      {loading ? (
        <Skeleton height={480} radius={radius.lg} />
      ) : error || !receipt ? (
        <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
      ) : (
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: 16 }}>
          <Card padding={24} shadow="md">
            <View className="flex-row items-center justify-between mb-4">
              <Logo size={32} />
              <Badge label="Đã xác nhận" tone="success" icon="checkmark-circle" size="md" />
            </View>

            <View className="items-center py-4 gap-1">
              <Text variant="caption" weight="semibold" color={colors.gray[500]} style={{ letterSpacing: 1 }}>
                PHIẾU THU
              </Text>
              <Text variant="smallMedium" color={colors.gray[700]}>
                Số: {receipt.code}
              </Text>
              <Text variant="display" color={colors.success[700]} style={{ marginTop: 8 }}>
                {formatCurrency(receipt.amount)}
              </Text>
            </View>

            <View
              style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.gray[200], marginVertical: 8 }}
            />

            <InfoRow label="Ngày thu" value={formatDate(receipt.paidDate)} />
            <InfoRow label="Người nộp" value={receipt.payerName} />
            <InfoRow label="Hợp đồng" value={receipt.contractCode} />
            <InfoRow label="Dự án / Căn" value={`${receipt.projectName} · ${receipt.unitCode}`} />
            <InfoRow label="Hình thức" value={paymentMethodLabels[receipt.method]} />
            {receipt.bankReference ? <InfoRow label="Mã giao dịch" value={receipt.bankReference} /> : null}
            <InfoRow label="Thu ngân" value={receipt.cashier} />
            <InfoRow label="Nội dung" value={receipt.content} last />
          </Card>

          <Button
            title="Xem hợp đồng"
            variant="secondary"
            leftIcon="document-text-outline"
            onPress={() => router.push({ pathname: '/contracts/[id]', params: { id: receipt.contractId } })}
          />
        </View>
      )}
    </Screen>
  );
}
