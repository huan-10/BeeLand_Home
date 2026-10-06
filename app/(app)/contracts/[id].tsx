import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import {
  ContractSummaryCard,
  InstallmentTimeline,
  PaymentConfirmDialog,
  ReceiptCard,
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
  useToast,
  type LineTabItem,
} from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useContract } from '@/hooks/useContracts';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { useReceipts } from '@/hooks/useReceipts';
import { formatCurrency, formatDate, formatDaysLeft } from '@/lib/format';
import { contractTypeLabels } from '@/lib/labels';
import { openDocument } from '@/lib/openDocument';
import { startPayment, type ContractDetail } from '@/services';
import type { PaymentInstallmentView } from '@/types';
import { colors, layout, radius, semantic, sizes, spacing } from '@/theme';

type TabKey = 'schedule' | 'receipts' | 'info';
const TABS_ID = 'contract-detail';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useBreakpoint();
  const toast = useToast();
  const detail = useContract(id);
  const receipts = useReceipts({ contractId: id });
  const { submit, submitting } = useFormSubmit(startPayment);

  const [tab, setTab] = useState<TabKey>('schedule');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const payButtonRef = useRef<View>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/contracts'));

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
  const payable = contract.summary.nextInstallment;

  const closeDialog = () => {
    setConfirmOpen(false);
    // Trả focus về nút đã mở hộp thoại (web).
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => (payButtonRef.current as unknown as HTMLElement | null)?.focus());
    }
  };

  const confirmPayment = async () => {
    if (!payable) return;
    const outcome = await submit(contract.id, payable.id);
    closeDialog();
    if (!outcome.ok) {
      toast.show(outcome.error.message, 'danger');
      return;
    }
    if (outcome.result.status === 'redirect' && outcome.result.checkoutUrl) {
      await openDocument(outcome.result.checkoutUrl, 'Thanh toán');
      return;
    }
    toast.show(outcome.result.message, 'info');
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
        accessibilityHint={`Thanh toán ${payable.name}, ${formatCurrency(payable.remainingAmount)}`}
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
              <InstallmentTimeline installments={installments} />
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
      installment={payable}
      submitting={submitting}
      onConfirm={() => void confirmPayment()}
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
              <PayInfo installment={payable} />
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

/** Thanh đáy (mobile): đợt sắp phải trả + số tiền bên trái, nút Thanh toán bên phải — biết trả gì trước khi bấm. */
function PayInfo({ installment }: { installment: PaymentInstallmentView }) {
  const overdue = installment.status === 'overdue';
  return (
    <View style={styles.payInfo} accessible accessibilityLabel={`${installment.name}, ${formatCurrency(installment.remainingAmount)}, hạn ${formatDate(installment.dueDate)}, ${formatDaysLeft(installment.daysUntilDue)}`}>
      <Text variant="caption" color={semantic.textMuted} numberOfLines={1}>
        {installment.name}
      </Text>
      <Text variant="subhead" weight="bold" numeric numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(installment.remainingAmount)}
      </Text>
      <Text variant="caption" weight={overdue ? 'semibold' : undefined} color={overdue ? colors.danger[700] : semantic.textMuted} numberOfLines={1}>
        {formatDaysLeft(installment.daysUntilDue)}
      </Text>
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
  return (
    <View style={styles.list}>
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
