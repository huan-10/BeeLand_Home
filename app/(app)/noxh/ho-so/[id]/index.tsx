import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NoxhAlert, NoxhStatusCard, ProcessTimeline, StepList, type StepListItem, UpdateCccdDialog } from '@/components/domain';
import { Col, Grid, Screen, Section } from '@/components/layout';
import { Button, Card, Dialog, ErrorState, KeyValueRow, ScreenHeader, Skeleton, SkeletonCard, Text, useToast } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAuth } from '@/contexts/AuthContext';
import { useNoxhApplication } from '@/hooks/useNoxh';
import { khachHangPayload } from '@/lib/noxhForm';
import { useServerClock } from '@/hooks/useServerClock';
import { formatDate } from '@/lib/format';
import { applicationSteps, docProgress, latestReason, missingRequiredDocs, personalInfoMissing, processTimeline, isMissingCccdError } from '@/lib/noxh';
import { deleteApplication, saveApplication } from '@/services';
import { getErrorMessage } from '@/services/errors';
import { radius, semantic, sizes, spacing } from '@/theme';
import type { NoxhApplicationDetail } from '@/types';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useBreakpoint();
  const toast = useToast();
  const { user } = useAuth();
  const { data: d, loading, refreshing, error, refetch } = useNoxhApplication(id, user?.phone);
  const clock = useServerClock(d?.boc_tham?.server_now);
  const [confirm, setConfirm] = useState<'submit' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [cccdOpen, setCccdOpen] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/noxh/ho-so'));

  const goDocs = () => router.push({ pathname: '/noxh/ho-so/[id]/giay-to', params: { id } });
  const goInfo = () => router.push({ pathname: '/noxh/ho-so/[id]/thong-tin', params: { id } });

  const submit = async () => {
    if (!d || busy) return;
    setBusy(true);
    try {
      await saveApplication({ id: d.id, dot_id: d.dot_id ?? '', nhom_doi_tuong_id: d.nhom_doi_tuong_id, khach_hang: khachHangPayload(d.kh_snapshot, user?.phone) }, true);
      setConfirm(null);
      router.replace({ pathname: '/noxh/ho-so/[id]/da-nop', params: { id: d.id } });
    } catch (e) {
      const message = getErrorMessage(e);
      setConfirm(null);
      toast.show(message, 'danger');
      // Máy chủ báo thiếu giấy tờ → mở màn giấy tờ để bổ sung.
      if (isMissingCccdError(message)) setCccdOpen(true);
      else if (message.startsWith('Chưa nộp giấy tờ bắt buộc')) goDocs();
      else if (message.startsWith('Chưa đủ thông tin')) goInfo();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!d || busy) return;
    setBusy(true);
    try {
      await deleteApplication(d.id);
      setConfirm(null);
      toast.show('Đã xoá hồ sơ', 'success');
      router.replace('/noxh/ho-so');
    } catch (e) {
      setConfirm(null);
      toast.show(getErrorMessage(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={() => void refetch()} refreshing={refreshing}>
      <ScreenHeader title="Chi tiết hồ sơ" subtitle={d?.ten_du_an ?? undefined} onBack={back} />
      {loading ? (
        <>
          <Skeleton height={sizes.skeleton.hero} radius={radius['3xl']} />
          <SkeletonCard lines={4} />
        </>
      ) : error || !d ? (
        <Card>
          <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <Grid gutter={isDesktop ? 'lg' : 'md'}>
          <Col span={{ mobile: 12, desktop: 5 }}>
            <View style={styles.column}>
              <NoxhStatusCard row={d} lotteryDone={!!d.boc_tham?.da_quay} />
              <StatusAlert d={d} />
              <Card padding="ml">
                <Text variant="heading" accessibilityRole="header" style={styles.cardTitle}>
                  Các bước hồ sơ
                </Text>
                <StepList steps={stepItems(d, goInfo, goDocs)} />
              </Card>
              <Actions d={d} onSubmit={() => setConfirm('submit')} onDelete={() => setConfirm('delete')} onDocs={goDocs} />
            </View>
          </Col>
          <Col span={{ mobile: 12, desktop: 7 }}>
            <View style={styles.column}>
              <Section title="Quá trình xử lý">
                <Card padding="ml">
                  <ProcessTimeline
                    steps={processTimeline(d, clock.now())}
                    onPressStep={
                      d.boc_tham
                        ? (key) => {
                            if (key === 'boc_tham' && d.boc_tham) router.push({ pathname: '/noxh/boc-tham/[id]', params: { id: d.boc_tham.bt_ho_so_id } });
                          }
                        : undefined
                    }
                  />
                </Card>
              </Section>
              <Section title="Thông tin hồ sơ">
                <Card padding="sm">
                  <KeyValueRow label="Số hồ sơ" value={d.so_ho_so} numeric copyable />
                  <KeyValueRow label="Đợt nhận hồ sơ" value={d.dot?.ten ?? '—'} />
                  <KeyValueRow label="Nhóm đối tượng" value={d.ten_nhom ?? '—'} />
                  <KeyValueRow label="Loại căn hộ" value={d.ten_loai_can ?? '—'} />
                  <KeyValueRow label={d.trang_thai === 'NHAP' ? 'Ngày tạo' : 'Ngày tiếp nhận'} value={formatDate(d.trang_thai === 'NHAP' ? d.created_at : d.ngay_tiep_nhan)} numeric />
                  <KeyValueRow label="Người đăng ký" value={d.kh_snapshot.ten_kh} last />
                </Card>
              </Section>
            </View>
          </Col>
        </Grid>
      )}

      <Dialog
        visible={confirm === 'submit'}
        title="Nộp hồ sơ"
        onClose={() => setConfirm(null)}
        actions={
          <>
            <Button title="Xem lại" variant="ghost" onPress={() => setConfirm(null)} disabled={busy} />
            <Button title="Nộp hồ sơ" leftIcon="checkCircle" loading={busy} onPress={() => void submit()} />
          </>
        }>
        <Text variant="body" color={semantic.textSecondary}>
          Tôi cam đoan những thông tin kê khai và giấy tờ đã nộp là đúng sự thật. Sau khi nộp, hồ sơ chuyển cho chủ đầu tư kiểm tra và không sửa được nữa.
        </Text>
      </Dialog>
      <Dialog
        visible={confirm === 'delete'}
        title="Xoá hồ sơ chưa nộp?"
        onClose={() => setConfirm(null)}
        actions={
          <>
            <Button title="Giữ lại" variant="ghost" onPress={() => setConfirm(null)} disabled={busy} />
            <Button title="Xoá hồ sơ" variant="danger" leftIcon="trash" loading={busy} onPress={() => void remove()} />
          </>
        }>
        <Text variant="body" color={semantic.textSecondary}>
          Thông tin và giấy tờ đã tải của hồ sơ {d?.so_ho_so} sẽ bị xoá. Bạn có thể tạo hồ sơ mới khi đợt còn mở.
        </Text>
      </Dialog>
      <UpdateCccdDialog
        visible={cccdOpen}
        companyId={d?.company_id ?? null}
        onClose={() => setCccdOpen(false)}
        onUpdated={() => {
          setCccdOpen(false);
          void submit();
        }}
      />
    </Screen>
  );
}

function stepItems(d: NoxhApplicationDetail, goInfo: () => void, goDocs: () => void): StepListItem[] {
  const steps = applicationSteps(d);
  const missingInfo = personalInfoMissing(d.kh_snapshot, d.loai_can_id).length;
  const { submitted, required } = docProgress(d.giay_to);
  return steps.map((s) => {
    if (s.key === 'thong_tin') return { ...s, hint: missingInfo ? `Còn thiếu ${missingInfo} mục` : undefined, onPress: goInfo };
    if (s.key === 'giay_to') return { ...s, hint: `Đã nộp ${submitted}/${required} giấy tờ bắt buộc`, onPress: goDocs };
    return s;
  });
}

function StatusAlert({ d }: { d: NoxhApplicationDetail }) {
  const reason = latestReason(d);
  if (d.trang_thai === 'CAN_BO_SUNG') {
    return <NoxhAlert tone="warning" icon="warning" title="Hồ sơ cần bổ sung giấy tờ" message={reason ?? 'Vui lòng tải lại các giấy tờ chưa đạt yêu cầu.'} />;
  }
  if (d.trang_thai === 'KHONG_DAT') return <NoxhAlert tone="danger" icon="closeCircle" title="Hồ sơ không đạt" message={reason} />;
  if (d.trang_thai === 'RUT_HO_SO') return <NoxhAlert tone="neutral" icon="info" title="Hồ sơ đã được rút" message={reason} />;
  if (d.trang_thai === 'NHAP') {
    return (
      <NoxhAlert
        tone="primary"
        icon="info"
        title="Hồ sơ chưa được nộp"
        message={d.dot ? `Hoàn thiện thông tin, giấy tờ và nộp trước ${formatDate(d.dot.den_ngay)}.` : 'Hoàn thiện thông tin và giấy tờ rồi nộp hồ sơ.'}
      />
    );
  }
  return null;
}

function Actions({ d, onSubmit, onDelete, onDocs }: { d: NoxhApplicationDetail; onSubmit: () => void; onDelete: () => void; onDocs: () => void }) {
  const q = d.quyen;
  if (!q.nop && !q.xoa && !q.gui_bo_sung) return null;
  const missingDocs = missingRequiredDocs(d.giay_to).length;
  const missingInfo = personalInfoMissing(d.kh_snapshot, d.loai_can_id).length;
  const blocked = missingDocs > 0 || missingInfo > 0;
  const hint = missingInfo ? `Còn thiếu ${missingInfo} mục thông tin cá nhân` : missingDocs ? `Còn thiếu ${missingDocs} giấy tờ bắt buộc` : null;
  return (
    <Card padding="ml">
      <Text variant="heading" accessibilityRole="header" style={styles.cardTitle}>
        Thao tác
      </Text>
      <View style={styles.actions}>
        {q.gui_bo_sung ? <Button title="Bổ sung giấy tờ" leftIcon="upload" fullWidth onPress={onDocs} /> : null}
        {q.nop ? (
          <>
            <Button title="Nộp hồ sơ" leftIcon="checkCircle" fullWidth disabled={blocked} onPress={onSubmit} />
            {hint ? (
              <Text variant="caption" color={semantic.textMuted} align="center">
                {hint}
              </Text>
            ) : null}
          </>
        ) : null}
        {q.xoa ? <Button title="Xoá hồ sơ" variant="danger" leftIcon="trash" fullWidth onPress={onDelete} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.ml },
  cardTitle: { marginBottom: spacing.sm },
  actions: { gap: spacing.ms },
});
