import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout';
import { Badge, Button, Card, ErrorState, KeyValueRow, ScreenHeader, Skeleton, StateView, Text, useToast } from '@/components/ui';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { usePaymentCheckout } from '@/hooks/usePaymentCheckout';
import { formatCurrency } from '@/lib/format';
import { formatCountdown, transferText, vietQrUrl } from '@/lib/paymentTarget';
import { saveQrImage } from '@/services';
import { getErrorMessage } from '@/services/errors';
import { layout, radius, semantic, sizes, spacing } from '@/theme';
import type { PaymentCheckout } from '@/types';

/**
 * Thanh toán QR (tài khoản định danh — như web booking / đặt cọc): mở từ "Xác nhận thanh toán" ở Chi tiết hợp đồng.
 * Params: `contractId`, `dot` (số đợt HĐMB; trống với đặt cọc / giữ chỗ), `code` (mã HĐ để hiển thị khi đang tải).
 * Quy chuẩn: design-system/beesky/pages/pay.md.
 */
export default function PayScreen() {
  const params = useLocalSearchParams<{ contractId?: string; dot?: string; code?: string }>();
  const contractId = params.contractId ?? '';
  const dot = params.dot ? Number(params.dot) : null;
  const state = usePaymentCheckout(contractId ? { contractId, dot: Number.isFinite(dot) ? dot : null, contractCode: params.code ?? '' } : null);

  // Về đúng hợp đồng vừa mở (nhánh Hợp đồng giữ màn chi tiết) — không dùng router.back(): màn này là tab ẩn,
  // back() của thanh tab rơi về Trang chủ. Đã nhận tiền → kèm `paidAt` để chi tiết tải lại phiếu thu.
  const backToContract = (paid = false) =>
    contractId
      ? router.navigate({ pathname: '/contracts/[id]', params: { id: contractId, ...(paid ? { paidAt: String(Date.now()) } : {}) } })
      : router.navigate('/contracts');
  const goBack = () => backToContract(state.phase === 'paid');
  useHardwareBack(() => {
    goBack();
    return true;
  });

  return (
    <Screen>
      <ScreenHeader title="Thanh toán" subtitle={state.checkout?.contractCode || params.code} onBack={goBack} />
      <View style={styles.column}>
        {state.phase === 'loading' ? (
          <Card padding="ml" style={styles.center}>
            <Skeleton height={sizes.qrCode} width={sizes.qrCode} radius={radius.lg} />
            <Text variant="caption" color={semantic.textMuted}>
              Đang tạo mã thanh toán…
            </Text>
          </Card>
        ) : state.phase === 'error' ? (
          <Card>
            <ErrorState title="Chưa tạo được mã thanh toán" message={state.error ?? undefined} onRetry={state.retry} />
          </Card>
        ) : state.phase === 'blocked' ? (
          <Card>
            <StateView
              icon={state.blockReason === 'WAIT_FOR_STAFF' ? 'hourglass' : 'info'}
              tone={state.blockReason === 'WAIT_FOR_STAFF' ? 'warning' : 'info'}
              role="alert"
              title={state.blockReason === 'WAIT_FOR_STAFF' ? 'Đang chờ tạo tài khoản thanh toán' : 'Chưa hỗ trợ thanh toán trực tuyến'}
              description={state.error ?? undefined}
              action={<Button title="Về hợp đồng" variant="outline" onPress={() => backToContract()} />}
            />
          </Card>
        ) : state.phase === 'paid' ? (
          <Card>
            <StateView
              icon="checkCircle"
              tone="success"
              role="alert"
              title="Đã nhận thanh toán"
              description={
                state.approved
                  ? 'Cảm ơn quý khách. Giao dịch đã được duyệt tự động; phiếu thu có trong mục Phiếu thu của hợp đồng.'
                  : 'Cảm ơn quý khách. Hệ thống đã ghi nhận và tạo phiếu thu cho khoản này.'
              }
              action={<Button title="Về hợp đồng" leftIcon="document" onPress={() => backToContract(true)} />}
            />
          </Card>
        ) : state.phase === 'expired' ? (
          <Card>
            <StateView
              icon="hourglass"
              tone="warning"
              role="alert"
              title="Mã thanh toán đã hết hạn"
              description="Thời gian giữ chỗ đã kết thúc hoặc mã đã bị huỷ. Nếu quý khách đã chuyển tiền, vui lòng liên hệ chủ đầu tư."
              action={<Button title="Về hợp đồng" variant="outline" onPress={() => backToContract()} />}
            />
          </Card>
        ) : state.checkout ? (
          <Checkout checkout={state.checkout} remaining={state.remaining} />
        ) : null}
      </View>
    </Screen>
  );
}

function Checkout({ checkout, remaining }: { checkout: PaymentCheckout; remaining: number | null }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const qrUrl = vietQrUrl(checkout);

  const copyAll = async () => {
    await Clipboard.setStringAsync(transferText(checkout));
    toast.show('Đã sao chép thông tin chuyển khoản', 'success');
  };
  const saveQr = async () => {
    setSaving(true);
    try {
      const msg = await saveQrImage(qrUrl, `QR-${checkout.contractCode || checkout.accountNumber}.png`);
      if (msg) toast.show(msg, 'success');
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View style={styles.amountBox}>
        <Text variant="caption" color={semantic.onInverseMuted}>
          Số tiền cần chuyển · {checkout.label}
        </Text>
        <Text variant="title" color={semantic.onInverse} numeric selectable>
          {formatCurrency(checkout.amount)}
        </Text>
        {remaining != null ? (
          <Badge tone="warning" icon="timer" label={`Mã còn hiệu lực ${formatCountdown(remaining)}`} />
        ) : null}
      </View>

      <Card padding="ml" style={styles.center}>
        <View style={styles.qrFrame}>
          <Image
            source={{ uri: qrUrl }}
            style={styles.qr}
            resizeMode="contain"
            accessibilityLabel={`Mã QR chuyển ${formatCurrency(checkout.amount)} vào tài khoản ${checkout.accountNumber}`}
          />
        </View>
        <Text variant="caption" color={semantic.textMuted} align="center">
          Mở ứng dụng ngân hàng, quét mã để chuyển đúng số tiền và nội dung.
        </Text>
        <View style={styles.waiting} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={semantic.textBrand} />
          <Text variant="captionStrong" color={semantic.textBrand}>
            Đang chờ nhận tiền…
          </Text>
        </View>
        <View style={styles.actions}>
          <Button title="Lưu mã QR" variant="outline" leftIcon="download" loading={saving} onPress={() => void saveQr()} style={styles.action} />
          <Button title="Sao chép" variant="outline" leftIcon="copy" onPress={() => void copyAll()} style={styles.action} />
        </View>
      </Card>

      <Card>
        <Text variant="label" color={semantic.textMuted} accessibilityRole="header">
          Hoặc chuyển khoản thủ công
        </Text>
        <KeyValueRow label="Ngân hàng" value={checkout.bankCode || '—'} />
        <KeyValueRow label="Số tài khoản" value={checkout.accountNumber} copyable numeric />
        <KeyValueRow label="Chủ tài khoản" value={checkout.accountName || '—'} />
        <KeyValueRow label="Số tiền" value={String(Math.round(checkout.amount))} copyable numeric />
        <KeyValueRow label="Nội dung" value={checkout.content} copyable last />
      </Card>

      <Text variant="caption" color={semantic.textMuted}>
        {checkout.module === 'BOOKING'
          ? 'Mã chỉ dùng được tới hết thời gian giữ chỗ. Khi nhận đủ tiền, phiếu giữ chỗ được duyệt tự động.'
          : checkout.module === 'DATCOC'
            ? 'Khi nhận đủ tiền cọc, phiếu đặt cọc được duyệt tự động và có phiếu thu.'
            : 'Tài khoản này dành riêng cho hợp đồng của quý khách. Sau khi nhận tiền, hệ thống tự tạo phiếu thu.'}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.md, width: '100%', maxWidth: layout.readableMaxWidth, alignSelf: 'center' },
  center: { alignItems: 'center', gap: spacing.ms },
  amountBox: { alignItems: 'center', gap: spacing.xs, padding: spacing.ml, borderRadius: radius.xl, backgroundColor: semantic.inverse },
  qrFrame: { padding: spacing.sm, borderRadius: radius.lg, backgroundColor: semantic.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: semantic.border },
  qr: { width: sizes.qrCode, height: sizes.qrCode },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  action: { flex: 1 },
});
