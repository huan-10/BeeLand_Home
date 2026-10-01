import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { receiptAmountStyle } from '@/components/domain';
import { Logo, Screen } from '@/components/layout';
import { Badge, Button, Card, ErrorState, InfoRow, ScreenHeader, Skeleton, Text, TextLink, useToast } from '@/components/ui';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { useReceipt } from '@/hooks/useReceipts';
import { formatCurrency, formatDate } from '@/lib/format';
import { paymentMethodLabels, receiptStatusMeta } from '@/lib/labels';
import { openDocument } from '@/lib/openDocument';
import { exportReceiptPdf, shareReceipt } from '@/services';
import { borderWidth, colors, layout, letterSpacing, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { ReceiptExportResult } from '@/types';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: receipt, loading, error, refetch } = useReceipt(id);
  const toast = useToast();
  const pdf = useFormSubmit(exportReceiptPdf);
  const share = useFormSubmit(shareReceipt);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/receipts'));

  /** Xuất / chia sẻ: hiện chỉ có giao diện — services trả `unavailable` (TODO xuất file thật). */
  const handleExport = async (action: typeof pdf.submit, title: string) => {
    if (!receipt) return;
    const outcome = await action(receipt.id);
    if (!outcome.ok) {
      toast.show(outcome.error.message, 'danger');
      return;
    }
    const result: ReceiptExportResult = outcome.result;
    if (result.status === 'ready' && result.url) await openDocument(result.url, title);
    else toast.show(result.message, 'info');
  };

  const meta = receipt ? receiptStatusMeta[receipt.status] : null;
  const amount = receipt ? receiptAmountStyle(receipt) : null;

  return (
    <Screen>
      <ScreenHeader title={receipt?.code ?? 'Phiếu thu'} subtitle="Chi tiết phiếu thu" onBack={goBack} />

      {loading ? (
        <Skeleton height={sizes.skeleton.page} radius={radius.lg} />
      ) : error || !receipt || !meta || !amount ? (
        <Card>
          <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <View style={styles.paper}>
          <Card padding="lg" shadow="md">
            <View className="flex-row items-center justify-between mb-md">
              <Logo size="sm" />
              <Badge label={meta.label} tone={meta.tone} icon={meta.icon} size="md" />
            </View>

            <View className="items-center py-md gap-xs">
              <Text variant="overline" color={semantic.textMuted} style={styles.overline}>
                PHIẾU THU
              </Text>
              <Text variant="smallMedium" color={semantic.textSecondary}>
                Số: {receipt.code}
              </Text>
              <Text variant="display" color={amount.color} style={[styles.amount, amount.strike && styles.strike]}>
                {formatCurrency(receipt.amount)}
              </Text>
            </View>

            {receipt.status !== 'paid' ? (
              <View style={[styles.notice, { backgroundColor: toneColors[meta.tone].bg }]} role="status">
                <Text variant="small" color={toneColors[meta.tone].fg}>
                  {receipt.status === 'pending'
                    ? 'Khoản thanh toán đã được ghi nhận và đang chờ kế toán xác nhận.'
                    : 'Phiếu thu này đã bị hủy và không có giá trị thanh toán.'}
                </Text>
              </View>
            ) : null}

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

          <View style={styles.actions}>
            <Button
              title="Tải PDF"
              variant="secondary"
              leftIcon="download"
              loading={pdf.submitting}
              onPress={() => void handleExport(pdf.submit, `Phiếu thu ${receipt.code}`)}
              style={styles.action}
            />
            <Button
              title="Chia sẻ"
              variant="outline"
              leftIcon="share"
              loading={share.submitting}
              onPress={() => void handleExport(share.submit, `Phiếu thu ${receipt.code}`)}
              style={styles.action}
            />
          </View>
          <View style={styles.link}>
            <TextLink
              label={`Xem hợp đồng ${receipt.contractCode}`}
              onPress={() => router.push({ pathname: '/contracts/[id]', params: { id: receipt.contractId } })}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  paper: { width: '100%', maxWidth: layout.readableMaxWidth, alignSelf: 'center', gap: spacing.md },
  overline: { letterSpacing: letterSpacing.wide },
  amount: { marginTop: spacing.sm, fontVariant: ['tabular-nums'] },
  strike: { textDecorationLine: 'line-through' },
  notice: { padding: spacing.ms, borderRadius: radius.md, marginBottom: spacing.sm },
  dashed: {
    borderTopWidth: borderWidth.hairline,
    borderStyle: 'dashed',
    borderColor: colors.gray[200],
    marginVertical: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.ms },
  action: { flex: 1 },
  link: { alignItems: 'center' },
});
