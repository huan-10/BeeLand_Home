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
  ScreenHeader,
  Skeleton,
  TabPanel,
  Tabs,
  Text,
  useToast,
  type TabItem,
} from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useContract } from '@/hooks/useContracts';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { useReceipts } from '@/hooks/useReceipts';
import { contractTypeLabels } from '@/lib/labels';
import { openDocument } from '@/lib/openDocument';
import { startPayment, type ContractDetail } from '@/services';
import { layout, radius, semantic, sizes, spacing } from '@/theme';

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

  const payButton = payable ? (
    <Button
      ref={payButtonRef}
      title="Thanh toán ngay"
      leftIcon="card"
      size="lg"
      fullWidth
      onPress={() => setConfirmOpen(true)}
      accessibilityHint={`Thanh toán ${payable.name}`}
    />
  ) : null;

  const summary = (
    <ContractSummaryCard
      contract={contract}
      onOpenDocument={() => void openDocument(detail.data?.document.url ?? '', detail.data?.document.title ?? '')}
      footer={isDesktop ? payButton : undefined}
    />
  );

  const receiptCount = receipts.data?.length;
  const tabItems: TabItem<TabKey>[] = [
    { key: 'schedule', label: 'Lịch thanh toán' },
    { key: 'receipts', label: 'Phiếu thu', count: receiptCount },
    { key: 'info', label: 'Thông tin khác' },
  ];

  const tabs = (
    <View>
      <Tabs id={TABS_ID} items={tabItems} value={tab} onChange={setTab} accessibilityLabel="Nội dung hợp đồng" />
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
      footer={payButton ? <StickyActionBar>{payButton}</StickyActionBar> : undefined}>
      {header(contract.code)}
      {summary}
      {tabs}
      {dialog}
    </Screen>
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
  return (
    <View style={styles.list}>
      <Card>
        <Text variant="label" color={semantic.textMuted} accessibilityRole="header">
          Bên bán
        </Text>
        <KeyValueRow label="Công ty" value={seller.companyName} />
        <KeyValueRow label="Người đại diện" value={`${seller.representative} – ${seller.position}`} />
        <KeyValueRow label="Mã số thuế" value={seller.taxCode} copyable numeric />
        <KeyValueRow label="Địa chỉ" value={seller.address} />
        <KeyValueRow label="Hotline" value={seller.hotline} copyable numeric />
        <KeyValueRow label="Email" value={seller.email} copyable last />
      </Card>
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
  term: { paddingVertical: spacing.ms, gap: spacing.xs },
  termDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semantic.border },
});
