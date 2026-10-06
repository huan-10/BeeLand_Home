import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PersonalInfoForm, type PersonalInfoFormHandle } from '@/components/domain';
import { Screen, StickyActionBar } from '@/components/layout';
import {
  Button,
  Card,
  ErrorState,
  FormErrorSummary,
  KeyValueRow,
  ScreenHeader,
  SkeletonCard,
  useToast,
  type FormErrorSummaryHandle,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNoxhApplication, useNoxhLoaiCan } from '@/hooks/useNoxh';
import { formatDate } from '@/lib/format';
import { khachHangPayload, validatePersonalInfo, type PersonalInfoErrors } from '@/lib/noxhForm';
import { clearPersonalDraft, getPersonalDraft, saveApplication, setPersonalDraft } from '@/services';
import { getErrorMessage } from '@/services/errors';
import { spacing } from '@/theme';
import type { NoxhAddress, NoxhCustomerSnapshot } from '@/types';

export default function PersonalInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { user } = useAuth();
  const app = useNoxhApplication(id, user?.phone);
  const loaiCan = useNoxhLoaiCan(app.data?.dot_id ?? undefined);
  const [edited, setEdited] = useState<{ snapshot: NoxhCustomerSnapshot; loaiCanId: string | null } | null>(null);
  const [errors, setErrors] = useState<PersonalInfoErrors>({});
  const [saving, setSaving] = useState(false);
  const formRef = useRef<PersonalInfoFormHandle>(null);
  const summaryRef = useRef<FormErrorSummaryHandle>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/noxh/ho-so/[id]', params: { id } }));

  const d = app.data;
  const editable = !!d?.quyen.sua_thong_tin;

  // Giá trị form: bản đang sửa, hoặc nháp đã lưu tạm, hoặc thông tin trên hồ sơ.
  const form = edited ?? (d ? (getPersonalDraft(d.id) ?? { snapshot: d.kh_snapshot, loaiCanId: d.loai_can_id ?? null }) : null);

  const change = (snapshot: NoxhCustomerSnapshot, loaiCanId: string | null) => {
    setEdited({ snapshot, loaiCanId });
    if (d) setPersonalDraft(d.id, snapshot, loaiCanId);
    if (Object.keys(errors).length) setErrors(validatePersonalInfo(snapshot, loaiCanId));
  };

  const save = async () => {
    if (!d || !form || saving) return;
    const found = validatePersonalInfo(form.snapshot, form.loaiCanId);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSaving(true);
    try {
      // Gửi đủ trường kèm SĐT (máy chủ dựng lại bản chụp từ đây — thiếu SĐT là hồ sơ mất SĐT).
      const khach_hang = khachHangPayload(form.snapshot, user?.phone);
      await saveApplication({ id: d.id, dot_id: d.dot_id ?? '', nhom_doi_tuong_id: d.nhom_doi_tuong_id, loai_can_id: form.loaiCanId, khach_hang }, false);
      clearPersonalDraft(d.id);
      toast.show('Đã lưu thông tin cá nhân', 'success');
      router.push({ pathname: '/noxh/ho-so/[id]/giay-to', params: { id: d.id } });
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    } finally {
      setSaving(false);
    }
  };

  const summary = Object.entries(errors).map(([field, message]) => ({ field, message: message ?? '' }));

  return (
    <Screen
      footer={
        editable && form ? (
          <StickyActionBar>
            <Button title="Lưu và tiếp tục" rightIcon="arrowRight" fullWidth loading={saving} onPress={() => void save()} />
          </StickyActionBar>
        ) : undefined
      }>
      <ScreenHeader title="Thông tin cá nhân" subtitle={editable ? 'Bước 2/3 · Khai thông tin người đăng ký' : d?.so_ho_so} onBack={back} />
      {app.loading ? (
        <SkeletonCard lines={6} />
      ) : app.error || !d || !form ? (
        <Card>
          <ErrorState message={app.error ?? undefined} onRetry={() => void app.refetch()} />
        </Card>
      ) : editable ? (
        <View style={styles.content}>
          {summary.length ? <FormErrorSummary ref={summaryRef} errors={summary} onSelect={(f) => formRef.current?.focusField(f)} /> : null}
          <PersonalInfoForm ref={formRef} value={form.snapshot} loaiCanId={form.loaiCanId} loaiCan={loaiCan.data ?? []} errors={errors} onChange={change} />
        </View>
      ) : (
        <ReadOnly snapshot={d.kh_snapshot} loaiCan={d.ten_loai_can ?? null} />
      )}
    </Screen>
  );
}

const addressText = (a: NoxhAddress) => [a.dia_chi, a.ten_xa, a.ten_tinh].filter(Boolean).join(', ') || '—';

/** Hồ sơ đã nộp: thông tin chỉ để xem. */
function ReadOnly({ snapshot: s, loaiCan }: { snapshot: NoxhCustomerSnapshot; loaiCan: string | null }) {
  return (
    <Card padding="sm">
      <KeyValueRow label="Họ và tên" value={s.ten_kh} />
      <KeyValueRow label="Ngày sinh" value={s.ngay_sinh ? formatDate(s.ngay_sinh) : '—'} numeric />
      <KeyValueRow label="Giới tính" value={s.gioi_tinh || '—'} />
      <KeyValueRow label="Số CCCD" value={s.cccd} numeric />
      <KeyValueRow label="Số điện thoại" value={s.di_dong} numeric />
      <KeyValueRow label="Email" value={s.email || '—'} />
      <KeyValueRow label="Thường trú" value={addressText(s.thuong_tru)} />
      <KeyValueRow label="Hiện tại" value={s.hien_tai_giong_thuong_tru ? 'Giống thường trú' : addressText(s.hien_tai)} />
      <KeyValueRow label="Loại căn hộ" value={loaiCan ?? '—'} last />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.ml },
});
