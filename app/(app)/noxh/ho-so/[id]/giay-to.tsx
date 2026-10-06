import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { InteractionManager, Platform, StyleSheet, View } from 'react-native';

import { DocumentRow, NoxhAlert, UploadSourceSheet, UpdateCccdDialog } from '@/components/domain';
import { Col, Grid, Screen, StickyActionBar } from '@/components/layout';
import { Button, Card, Dialog, ErrorState, ProgressBar, ScreenHeader, SkeletonList, Text, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNoxhApplication } from '@/hooks/useNoxh';
import { khachHangPayload } from '@/lib/noxhForm';
import { formatDate } from '@/lib/format';
import { openDocument } from '@/lib/openDocument';
import { docProgress, docsNeedingSupplement, missingRequiredDocs, nearestDueDate, personalInfoMissing, isMissingCccdError } from '@/lib/noxh';
import { openDoc, pickFile, pickSources, removeDoc, saveApplication, sendSupplement, uploadDoc, type PickSource } from '@/services';
import { getErrorMessage } from '@/services/errors';
import { motion, semantic, spacing, toneColors } from '@/theme';
import type { NoxhDoc } from '@/types';

export default function DocumentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { user } = useAuth();
  const app = useNoxhApplication(id, user?.phone);
  /** Giấy tờ vừa tải / bỏ — hiện ngay, không chờ tải lại cả hồ sơ. */
  const [overrides, setOverrides] = useState<Record<string, NoxhDoc>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [sheetFor, setSheetFor] = useState<NoxhDoc | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cccdOpen, setCccdOpen] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/noxh/ho-so/[id]', params: { id } }));

  const d = app.data;
  const docs = (d?.giay_to ?? []).map((x) => overrides[x.id] ?? x);
  const progress = docProgress(docs);
  const missing = missingRequiredDocs(docs);
  const isDraft = d?.trang_thai === 'NHAP';
  const isSupplement = d?.trang_thai === 'CAN_BO_SUNG';
  // Mốc so hạn nộp: lấy một lần khi mở màn (đủ chính xác cho so theo ngày).
  const [now] = useState(() => Date.now());

  const setDocError = (docId: string, message?: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[docId] = message;
      else delete next[docId];
      return next;
    });

  const sourcesFor = (doc: NoxhDoc): PickSource[] =>
    pickSources.filter((s) => s === 'document' || doc.dinh_dang.includes('jpg') || doc.dinh_dang.includes('png'));

  const upload = async (doc: NoxhDoc, source: PickSource) => {
    setSheetFor(null);
    setDocError(doc.id);
    let file;
    try {
      file = await pickFile(source, doc.dinh_dang);
    } catch (e) {
      setDocError(doc.id, getErrorMessage(e));
      return;
    }
    if (!file || !d) return;
    setUploading(doc.id);
    try {
      const saved = await uploadDoc(d.id, doc.id, file, doc);
      setOverrides((prev) => ({ ...prev, [doc.id]: saved }));
      setMissingIds((prev) => prev.filter((x) => x !== doc.id));
      toast.show(`Đã tải ${doc.ten}`, 'success');
    } catch (e) {
      setDocError(doc.id, getErrorMessage(e));
    } finally {
      setUploading(null);
    }
  };

  const startUpload = (doc: NoxhDoc) => {
    const sources = sourcesFor(doc);
    // Một nguồn (web / chỉ nhận PDF) → mở ngay trong thao tác bấm (trình duyệt chặn nếu mở sau).
    if (sources.length === 1) void upload(doc, sources[0]);
    else setSheetFor(doc);
  };

  const remove = async (doc: NoxhDoc) => {
    if (!d) return;
    try {
      const saved = await removeDoc(d.id, doc.id);
      setOverrides((prev) => ({ ...prev, [doc.id]: saved }));
    } catch (e) {
      setDocError(doc.id, getErrorMessage(e));
    }
  };

  const view = async (doc: NoxhDoc, loai: 'tep' | 'mau') => {
    if (!d) return;
    try {
      const url = await openDoc(d.id, doc.id, loai);
      // Chỉ mở liên kết https:// do máy chủ ký.
      if (url && /^https:\/\//.test(url)) await openDocument(url, doc.ten);
      else toast.show('Bản xem thử chưa có tệp thật để mở', 'info');
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    }
  };

  const submit = async () => {
    if (!d || busy) return;
    setBusy(true);
    try {
      await saveApplication({ id: d.id, dot_id: d.dot_id ?? '', nhom_doi_tuong_id: d.nhom_doi_tuong_id, khach_hang: khachHangPayload(d.kh_snapshot, user?.phone) }, true);
      setConfirmSubmit(false);
      router.replace({ pathname: '/noxh/ho-so/[id]/da-nop', params: { id: d.id } });
    } catch (e) {
      setConfirmSubmit(false);
      const message = getErrorMessage(e);
      toast.show(message, 'danger');
      if (isMissingCccdError(message)) setCccdOpen(true);
      else if (message.startsWith('Chưa đủ thông tin')) router.push({ pathname: '/noxh/ho-so/[id]/thong-tin', params: { id: d.id } });
      else setMissingIds(missingRequiredDocs(docs).map((x) => x.id));
    } finally {
      setBusy(false);
    }
  };

  const supplement = async () => {
    if (!d || busy) return;
    setBusy(true);
    try {
      await sendSupplement(d.id);
      toast.show('Đã gửi bổ sung. Chủ đầu tư sẽ kiểm tra lại hồ sơ.', 'success');
      router.replace({ pathname: '/noxh/ho-so/[id]', params: { id: d.id } });
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
      setMissingIds(docsNeedingSupplement(docs).filter((x) => x.bat_buoc).map((x) => x.id));
    } finally {
      setBusy(false);
    }
  };

  // Thiếu thông tin cá nhân → nói rõ mục nào và đưa nút về bước 2 thay vì nút "Nộp hồ sơ" bị khoá không rõ lý do.
  // Số điện thoại lấy theo tài khoản (khách không sửa được trong form) → chỉ còn thiếu nó thì mời liên hệ chủ đầu tư.
  const infoMissing = d ? personalInfoMissing(d.kh_snapshot, d.loai_can_id) : [];
  const onlyPhoneMissing = infoMissing.length > 0 && infoMissing.every((f) => f === 'Số điện thoại');
  const goInfo = () => d && router.push({ pathname: '/noxh/ho-so/[id]/thong-tin', params: { id: d.id } });
  const footer = d?.quyen.nop ? (
    <StickyActionBar>
      {infoMissing.length || missing.length ? (
        <Text variant="caption" color={infoMissing.length ? toneColors.warning.fg : semantic.textMuted} align="center" style={styles.footerHint}>
          {onlyPhoneMissing
            ? 'Tài khoản chưa có số điện thoại — vui lòng liên hệ chủ đầu tư'
            : infoMissing.length
              ? `Thông tin cá nhân còn thiếu: ${infoMissing.join(', ')}`
              : `Còn thiếu ${missing.length} giấy tờ bắt buộc`}
        </Text>
      ) : null}
      {infoMissing.length && !onlyPhoneMissing ? (
        <Button title="Bổ sung thông tin cá nhân" leftIcon="user" fullWidth onPress={goInfo} />
      ) : (
        <Button title="Nộp hồ sơ" leftIcon="checkCircle" fullWidth disabled={missing.length > 0 || infoMissing.length > 0} onPress={() => setConfirmSubmit(true)} />
      )}
    </StickyActionBar>
  ) : d?.quyen.gui_bo_sung ? (
    <StickyActionBar>
      <Button title="Gửi bổ sung" leftIcon="upload" fullWidth loading={busy} onPress={() => void supplement()} />
    </StickyActionBar>
  ) : undefined;

  const due = nearestDueDate(docs);
  const needCount = docsNeedingSupplement(docs).filter((x) => !x.tep_ten || x.trang_thai === 'CHUA_DAT').length;

  return (
    <Screen onRefresh={() => void app.refetch()} refreshing={app.refreshing} footer={footer}>
      <ScreenHeader title="Giấy tờ" subtitle={isDraft ? 'Bước 3/3 · Tải giấy tờ theo danh mục' : d?.so_ho_so} onBack={back} />
      {app.loading ? (
        <SkeletonList count={4} />
      ) : app.error || !d ? (
        <Card>
          <ErrorState message={app.error ?? undefined} onRetry={() => void app.refetch()} />
        </Card>
      ) : (
        <View style={styles.content}>
          <Card padding="ml">
            <View style={styles.progressHead}>
              <Text variant="heading" accessibilityRole="header" style={styles.flex}>
                Giấy tờ bắt buộc
              </Text>
              <Text variant="subhead" numeric color={semantic.textBrand}>
                {progress.submitted}/{progress.required}
              </Text>
            </View>
            <ProgressBar
              value={progress.required ? (progress.submitted / progress.required) * 100 : 0}
              tone={progress.submitted >= progress.required ? 'success' : 'primary'}
              accessibilityLabel={`Đã nộp ${progress.submitted}/${progress.required} giấy tờ bắt buộc`}
            />
            <Text variant="caption" color={semantic.textMuted} style={styles.progressNote}>
              Đã nộp {progress.submitted}/{progress.required} giấy tờ bắt buộc. Ảnh chụp cần rõ nét, đủ 4 góc.
            </Text>
          </Card>

          {isSupplement && needCount > 0 ? (
            <NoxhAlert
              tone="warning"
              icon="warning"
              title={`Cần bổ sung ${needCount} giấy tờ${due ? ` trước ${formatDate(due)}` : ''}`}
              message="Tải lại các giấy tờ có ghi chú chưa đạt rồi bấm Gửi bổ sung."
            />
          ) : null}

          <Grid gutter="md">
            {docs.map((doc) => (
              <Col key={doc.id} span={{ mobile: 12, desktop: 6 }}>
                <DocumentRow
                  doc={doc}
                  editable={d.quyen.sua_giay_to.includes(doc.id)}
                  uploading={uploading === doc.id}
                  error={errors[doc.id]}
                  highlight={missingIds.includes(doc.id)}
                  now={now}
                  onUpload={() => startUpload(doc)}
                  onView={() => void view(doc, 'tep')}
                  onRemove={() => void remove(doc)}
                  onTemplate={doc.co_mau ? () => void view(doc, 'mau') : undefined}
                />
              </Col>
            ))}
          </Grid>
        </View>
      )}

      <UploadSourceSheet
        visible={!!sheetFor}
        title={sheetFor ? `Tải ${sheetFor.ten}` : 'Tải giấy tờ'}
        sources={sheetFor ? sourcesFor(sheetFor) : []}
        onClose={() => setSheetFor(null)}
        onPick={(s) => {
          if (!sheetFor) return;
          const doc = sheetFor;
          setSheetFor(null);
          // iOS không mở được trình chọn ảnh/tệp khi Modal còn đang đóng → đợi hộp chọn nguồn đóng hẳn rồi mới mở.
          if (Platform.OS === 'web') void upload(doc, s);
          else InteractionManager.runAfterInteractions(() => setTimeout(() => void upload(doc, s), motion.slow));
        }}
      />
      <Dialog
        visible={confirmSubmit}
        title="Nộp hồ sơ"
        onClose={() => setConfirmSubmit(false)}
        actions={
          <>
            <Button title="Xem lại" variant="ghost" onPress={() => setConfirmSubmit(false)} disabled={busy} />
            <Button title="Nộp hồ sơ" leftIcon="checkCircle" loading={busy} onPress={() => void submit()} />
          </>
        }>
        <Text variant="body" color={semantic.textSecondary}>
          Tôi cam đoan những thông tin kê khai và giấy tờ đã nộp là đúng sự thật. Sau khi nộp, hồ sơ chuyển cho chủ đầu tư kiểm tra và không sửa được nữa.
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

const styles = StyleSheet.create({
  content: { gap: spacing.ml },
  progressHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.ms },
  progressNote: { marginTop: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  footerHint: { marginBottom: spacing.sm },
});
