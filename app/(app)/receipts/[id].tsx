import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Logo, Screen } from '@/components/layout';
import { Badge, Button, Card, ErrorState, InfoRow, ScreenHeader, Skeleton, Text } from '@/components/ui';
import { useReceipt } from '@/hooks/useReceipts';
import { formatCurrency, formatDate } from '@/lib/format';
import { paymentMethodLabels } from '@/lib/labels';
import { borderWidth, colors, layout, letterSpacing, radius, semantic, sizes, spacing } from '@/theme';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: receipt, loading, error, refetch } = useReceipt(id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/receipts'));

  return (
    <Screen>
      <ScreenHeader title={receipt?.code ?? 'Phiếu thu'} subtitle="Chi tiết phiếu thu" onBack={goBack} />

      {loading ? (
        <Skeleton height={sizes.skeleton.page} radius={radius.lg} />
      ) : error || !receipt ? (
        <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
      ) : (
        <View style={styles.paper}>
          <Card padding="lg" shadow="md">
            <View className="flex-row items-center justify-between mb-md">
              <Logo size="sm" />
              <Badge label="Đã xác nhận" tone="success" icon="checkmark-circle" size="md" />
            </View>

            <View className="items-center py-md gap-xs">
              <Text variant="overline" color={semantic.textMuted} style={styles.overline}>
                PHIẾU THU
              </Text>
              <Text variant="smallMedium" color={semantic.textSecondary}>
                Số: {receipt.code}
              </Text>
              <Text variant="display" color={colors.success[700]} style={styles.amount}>
                {formatCurrency(receipt.amount)}
              </Text>
            </View>

            <View style={styles.dashed} />

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

const styles = StyleSheet.create({
  paper: { width: '100%', maxWidth: layout.readableMaxWidth, alignSelf: 'center', gap: spacing.md },
  overline: { letterSpacing: letterSpacing.wide },
  amount: { marginTop: spacing.sm },
  dashed: {
    borderTopWidth: borderWidth.hairline,
    borderStyle: 'dashed',
    borderColor: colors.gray[200],
    marginVertical: spacing.sm,
  },
});
