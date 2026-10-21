import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  ContractSummaryCard,
  InstallmentTimeline,
  PaymentConfirmDialog,
  ReceiptCard,
  ReceiptsSummaryCard,
} from '@/components/domain';
import { Screen, StickyActionBar } from '@/components/layout';
import {
  Breadcrumb,
  Button,
  Card,
  EmptyState,
  ErrorState,
  KeyValueRow,
  LineTabs,
  ScreenHeader,
  Skeleton,
  TabPanel,
  Text,
  type LineTabItem,
} from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useContract } from '@/hooks/useContracts';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency } from '@/lib/format';
import { payTargetLabel } from '@/lib/installmentText';
import { summarizeReceipts } from '@/lib/receiptAllocation';
import { payTargetDeadline } from '@/lib/paymentTarget';
import { contractTypeLabels } from '@/lib/labels';
import { openDocument } from '@/lib/openDocument';
import type { ContractDetail } from '@/services';
import type { PayTarget } from '@/types';
import { colors, layout, radius, semantic, sizes, spacing } from '@/theme';

type TabKey = 'schedule' | 'receipts' | 'info';
const TABS_ID = 'contract-detail';

export default function ContractDetailScreen() {
  const { id, paidAt } = useLocalSearchParams<{ id: string; paidAt?: string }>();
  const navigation = useNavigation();
  const { isDesktop } = useBreakpoint();
  const detail = useContract(id);
  const receipts = useReceipts({ contractId: id });

  const [tab, setTab] = useState<TabKey>('schedule');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const payButtonRef = useRef<View>(null);

  // Chỉ lùi TRONG nhánh Hợp đồng (Stack). `router.canGoBack()` xét cả thanh tab → `back()` rơi về tab đầu (Trang chủ)
  // khi vào thẳng chi tiết (từ Trang chủ / Thanh toán / màn QR). Không có màn dưới → danh sách hợp đồng.
  const goBack = () => ((navigation.getState()?.index ?? 0) > 0 ? navigation.goBack() : router.replace('/contracts'));
  // Android: nhánh không còn màn dưới → về danh sách hợp đồng (không để thanh tab đưa về Trang chủ).
  useHardwareBack(() => {
    if ((navigation.getState()?.index ?? 0) > 0) return false;
    router.replace('/contracts');
    return true;
  });

  // Màn QR báo đã nhận tiền (`paidAt`) → tải lại lịch thanh toán + phiếu thu.
  useEffect(() => {
    if (!paidAt) return;
    void detail.refetch();
    void receipts.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi có lần thanh toán mới
  }, [paidAt]);

  const header = (title: string) => (
    <View style={styles.header}>
      {isDesktop ? (
        <Breadcrumb items={[{ label: 'Hợp đồng', onPress: () => router.navigate('/contracts') }, { label: title }]} />
      ) : null}
      <ScreenHeader title="Chi tiết hợp đồng" onBack={goBack} />
    </View>
  );

  if (detail.loading) {
    return (
      <Screen>
        {header('Đang tải…')}
        <Skeleton height={sizes.skeleton.block} radius={radius.lg} />
        <Skeleton height={sizes.control.md} radius={radius.md} />
        <Skeleton height={sizes.skeleton.block} radius={radius.lg} />
      </Screen>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <Screen>
        {header('Không tìm thấy')}
        <Card>
          <ErrorState message={detail.error ?? undefined} onRetry={() => void detail.refetch()} />
        </Card>
      </Screen>
    );
  }

  const { contract, installments } = detail.data;
  // Đợt kế tiếp (HĐMB) / tiền cọc / tiền giữ chỗ — cùng quy tắc với máy chủ (lib/paymentTarget).
  const payable = detail.data.payTarget;

  const closeDialog = () => {
    setConfirmOpen(false);
    // Trả focus về nút đã mở hộp thoại (web).
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => (payButtonRef.current as unknown as HTMLElement | null)?.focus());
    }
  };

  // Mở màn mã QR (máy chủ tạo / dùng lại tài khoản định danh, tự tính số tiền).
  const confirmPayment = () => {
    if (!payable) return;
    setConfirmOpen(false);
    router.push({
      pathname: '/pay',
      params: { contractId: payable.contractId, code: payable.contractCode, ...(payable.dot != null ? { dot: String(payable.dot) } : {}) },
    });
  };

  const payButton = (fullWidth: boolean) =>
    payable ? (
      <Button
        ref={payButtonRef}
        title={fullWidth ? 'Thanh toán ngay' : 'Thanh toán'}
        leftIcon="card"
        size="lg"
        fullWidth={fullWidth}
        onPress={() => setConfirmOpen(true)}
        accessibilityHint={`Thanh toán ${payable.name}, ${formatCurrency(payable.amount)}`}
      />
    ) : null;

  const summary = (
    <ContractSummaryCard
      contract={contract}
      onOpenDocument={detail.data?.document ? () => void openDocument(detail.data?.document?.url ?? '', detail.data?.document?.title ?? '') : undefined}
      footer={isDesktop ? payButton(true) : undefined}
    />
  );

  const receiptCount = receipts.data?.length;
  const tabItems: LineTabItem<TabKey>[] = [
    { key: 'schedule', label: 'Lịch thanh toán' },
    { key: 'receipts', label: 'Phiếu thu', count: receiptCount },
    { key: 'info', label: 'Thông tin' },
  ];

  const tabBar = <LineTabs id={TABS_ID} items={tabItems} value={tab} onChange={setTab} accessibilityLabel="Nội dung hợp đồng" />;
  const panel = (
      <TabPanel id={TABS_ID} tabKey={tab}>
        {tab === 'schedule' ? (
          <Card padding="ml">
            {installments.length > 0 ? (
              <InstallmentTimeline
                installments={installments}
                defaultExpandedId={payable?.module === 'HOPDONG' ? installments.find((i) => i.sequence === payable.dot)?.id : null}
              />
            ) : (
              <EmptyState icon="calendar" title="Chưa có lịch thanh toán" />
            )}
          </Card>
        ) : tab === 'receipts' ? (
          <ReceiptsPanel state={receipts} />
        ) : (
          <InfoPanel detail={detail.data} />
        )}
      </TabPanel>
  );
  const tabs = (
    <View>
      {tabBar}
      {panel}
    </View>
  );

  const dialog = payable ? (
    <PaymentConfirmDialog
      visible={confirmOpen}
      target={payable}
      onConfirm={confirmPayment}
      onClose={closeDialog}
    />
  ) : null;

  if (isDesktop) {
    // Desktop: trái thông tin hợp đồng (cuộn riêng, luôn trong tầm nhìn), phải tab + timeline.
    return (
      <Screen scroll={false}>
        {header(contract.code)}
        <View style={styles.columns}>
          <ScrollView style={styles.aside} contentContainerStyle={styles.columnContent} showsVerticalScrollIndicator={false}>
            {summary}
          </ScrollView>
          <ScrollView style={styles.main} contentContainerStyle={styles.columnContent}>
            {tabs}
          </ScrollView>
        </View>
        {dialog}
      </Screen>
    );
  }

  return (
    <Screen
      onRefresh={() => {
        void detail.refetch();
        void receipts.refetch();
      }}
      refreshing={detail.refreshing}
      footer={
        payable ? (
          <StickyActionBar>
            <View style={styles.payBar}>
              <PayInfo target={payable} />
              {payButton(false)}
            </View>
          </StickyActionBar>
        ) : undefined
      }
      top={
        <>
          {header(contract.code)}
          {summary}
        </>
      }
      sticky={() => tabBar}>
      {panel}
      {dialog}
    </Screen>
  );
}

/** Thanh đáy (mobile): khoản sắp phải trả + số tiền bên trái, nút Thanh toán bên phải — biết trả gì trước khi bấm. */
function PayInfo({ target }: { target: PayTarget }) {
  const overdue = target.daysUntilDue != null && target.daysUntilDue < 0;
  const deadline = payTargetDeadline(target);
  return (
    <View style={styles.payInfo} accessible accessibilityLabel={[payTargetLabel(target), formatCurrency(target.amount), deadline].filter(Boolean).join(', ')}>
      <Text variant="caption" color={semantic.textMuted} numberOfLines={1}>
        {payTargetLabel(target)}
      </Text>
      <Text variant="subhead" weight="bold" numeric numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(target.amount)}
      </Text>
      {deadline ? (
        <Text variant="caption" weight={overdue ? 'semibold' : undefined} color={overdue ? colors.danger[700] : semantic.textMuted} numberOfLines={1}>
          {deadline}
        </Text>
      ) : null}
    </View>
  );
}

function ReceiptsPanel({ state }: { state: ReturnType<typeof useReceipts> }) {
  if (state.loading) {
    return (
      <View style={styles.list}>
        <Skeleton height={sizes.skeleton.row} radius={radius.lg} />
        <Skeleton height={sizes.skeleton.row} radius={radius.lg} />
      </View>
    );
  }
  if (state.error) {
    return (
      <Card>
        <ErrorState message={state.error} onRetry={() => void state.refetch()} />
      </Card>
    );
  }
  if (!state.data || state.data.length === 0) {
    return (
      <Card>
        <EmptyState icon="receipt" title="Chưa có phiếu thu" description="Phiếu thu sẽ xuất hiện sau khi khoản thanh toán được xác nhận." />
      </Card>
    );
  }
  // Tổng phiếu ≠ phần trừ vào hợp đồng (tiền lãi, thu dư) → khối đối chiếu để khách hiểu vì sao vẫn còn nợ.
  const summary = summarizeReceipts(state.data);
  return (
    <View style={styles.list}>
      {summary && summary.total !== summary.intoContract ? <ReceiptsSummaryCard summary={summary} /> : null}
      {state.data.map((r) => (
        <ReceiptCard key={r.id} receipt={r} onPress={() => router.push({ pathname: '/receipts/[id]', params: { id: r.id } })} />
      ))}
    </View>
  );
}

function InfoPanel({ detail }: { detail: ContractDetail }) {
  const { contract, seller, terms } = detail;
  // Dữ liệu thật có thể thiếu người đại diện / mã số thuế → chỉ hiện dòng có giá trị.
  const sellerRows = [
    { label: 'Công ty', value: seller.companyName },
    { label: 'Người đại diện', value: [seller.representative, seller.position].filter(Boolean).join(' – ') },
    { label: 'Mã số thuế', value: seller.taxCode, copyable: true, numeric: true },
    { label: 'Địa chỉ', value: seller.address },
    { label: 'Hotline', value: seller.hotline, copyable: true, numeric: true },
    { label: 'Email', value: seller.email, copyable: true },
  ].filter((r) => r.value);
  return (
    <View style={styles.list}>
      <Card>
        <Text variant="label" color={semantic.textMuted} accessibilityRole="header">
          Bên bán
        </Text>
        {sellerRows.map((r, i) => (
          <KeyValueRow key={r.label} label={r.label} value={r.value} copyable={r.copyable} numeric={r.numeric} last={i === sellerRows.length - 1} />
        ))}
      </Card>
      {terms.length > 0 ? (
      <Card>
        <Text variant="label" color={semantic.textMuted} accessibilityRole="header">
          Điều khoản chính
        </Text>
        {terms.map((t, i) => (
          <View key={t.title} style={[styles.term, i < terms.length - 1 && styles.termDivider]}>
            <Text variant="captionStrong" weight="semibold">
              {t.title}
            </Text>
            <Text variant="caption" color={semantic.textSecondary}>
              {t.content}
            </Text>
          </View>
        ))}
      </Card>
      ) : null}
      <Card>
        <Text variant="label" color={semantic.textMuted} accessibilityRole="header">
          Thông tin căn hộ
        </Text>
        <KeyValueRow label="Loại hợp đồng" value={contractTypeLabels[contract.type].label} />
        <KeyValueRow label="Diện tích thông thủy" value={`${contract.area.toString().replace('.', ',')} m²`} />
        <KeyValueRow label="Chuyên viên tư vấn" value={contract.salesAgent ?? '—'} last />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  columns: { flex: 1, flexDirection: 'row', gap: spacing.lg, minHeight: 0 },
  // flexBasis 0 để tỷ lệ 5 : 7 đúng cả trên web (ScrollView của react-native-web).
  aside: { flexGrow: layout.detailAsideFlex, flexShrink: 1, flexBasis: 0 },
  main: { flexGrow: layout.detailMainFlex, flexShrink: 1, flexBasis: 0 },
  columnContent: { paddingBottom: spacing.lg },
  list: { gap: spacing.sm },
  payBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  payInfo: { flex: 1, minWidth: 0 },
  term: { paddingVertical: spacing.ms, gap: spacing.xs },
  termDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semantic.border },
});
