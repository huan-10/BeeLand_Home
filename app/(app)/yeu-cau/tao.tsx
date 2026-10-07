import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { InteractionManager, Platform, StyleSheet, View, type TextInput } from 'react-native';

import { AttachmentGrid, PickerDialog, SelectField, UploadSourceSheet } from '@/components/domain';
import { Screen, StickyActionBar } from '@/components/layout';
import { Button, Card, Chip, ErrorState, Input, ScreenHeader, Skeleton, Text, useToast } from '@/components/ui';
import { useRequestOptions } from '@/hooks/useRequests';
import {
  contractOptionParts,
  REQUEST_CONTENT_MAX,
  REQUEST_FILE_MAX_MB,
  REQUEST_FILES_MAX,
  REQUEST_TITLE_MAX,
  validateRequestForm,
  type RequestFormErrors,
} from '@/lib/requests';
import { checkRequestFile, createRequest, getErrorMessage, pickFile, pickSources, REQUEST_FORMATS, type PickSource, type PickedFile } from '@/services';
import { colors, motion, radius, semantic, sizes, spacing } from '@/theme';

/**
 * Gửi yêu cầu — chỉ các ô khách cần (như mẫu): Căn hộ / hợp đồng (tuỳ chọn, 1 căn thì chọn sẵn) · Loại (tuỳ chọn) ·
 * Tiêu đề* · Nội dung · Ảnh / tệp (≤ 5, 10 MB). Nguồn, trạng thái "Mới", số phiếu, ưu tiên… do máy chủ / nhân viên gán (như web).
 */
export default function NewRequestScreen() {
  const toast = useToast();
  const options = useRequestOptions();
  const [contractId, setContractId] = useState<string>();
  const [contractTouched, setContractTouched] = useState(false);
  const [categoryId, setCategoryId] = useState<string>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const titleRef = useRef<TextInput>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/yeu-cau'));

  const contracts = options.data?.contracts ?? [];
  const categories = options.data?.categories ?? [];
  // Khách chỉ có 1 hợp đồng → chọn sẵn (vẫn bỏ chọn được).
  const selectedContract = contractTouched ? contractId : (contractId ?? (contracts.length === 1 ? contracts[0]?.id : undefined));
  // Hàng 2 dòng: mã căn đậm + "Dự án · Số phiếu" (tên gốc dài, ngắt dòng lộn xộn).
  const contractItems = useMemo(
    () => [
      { value: '', label: 'Không chọn', description: 'Yêu cầu chung, không gắn căn hộ' },
      ...(options.data?.contracts ?? []).map((c) => {
        const p = contractOptionParts(c.name);
        return { value: c.id, label: p.title, description: p.subtitle || undefined };
      }),
    ],
    [options.data?.contracts],
  );
  const picked = contractItems.find((i) => i.value && i.value === selectedContract);
  // Ô đã chọn: gọn "Mã căn · Dự án".
  const contractName = picked ? [picked.label, picked.description?.split(' · ')[0]].filter(Boolean).join(' · ') : undefined;

  const addFile = async (source: PickSource) => {
    try {
      const file = await pickFile(source, REQUEST_FORMATS);
      if (!file) return;
      const bad = checkRequestFile(file);
      if (bad) {
        setErrors((e) => ({ ...e, files: bad }));
        return;
      }
      setFiles((f) => (f.length >= REQUEST_FILES_MAX ? f : [...f, file]));
      setErrors((e) => ({ ...e, files: undefined }));
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    }
  };

  const submit = async () => {
    if (sending) return;
    const found = validateRequestForm({ title, content, files: files.length });
    setErrors(found);
    if (found.title) {
      requestAnimationFrame(() => titleRef.current?.focus());
      return;
    }
    if (found.content || found.files) return;
    setSending(files.length ? `Đang tải tệp 1/${files.length}…` : 'Đang gửi…');
    try {
      const res = await createRequest(
        { title, content, categoryId, contractId: selectedContract, files },
        (done, total) => setSending(done < total ? `Đang tải tệp ${done + 1}/${total}…` : 'Đang gửi…'),
      );
      toast.show(res.code ? `Đã gửi yêu cầu ${res.code}` : 'Đã gửi yêu cầu', 'success');
      router.replace(res.id ? { pathname: '/yeu-cau/[id]', params: { id: res.id } } : '/yeu-cau');
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    } finally {
      setSending(null);
    }
  };

  return (
    <Screen
      footer={
        <StickyActionBar>
          <Button title={sending ?? 'Gửi yêu cầu'} leftIcon="message" fullWidth loading={!!sending} onPress={() => void submit()} />
        </StickyActionBar>
      }>
      <ScreenHeader title="Gửi yêu cầu" subtitle="Chủ đầu tư phản hồi ngay trong ứng dụng" onBack={back} />

      {options.loading ? (
        <Skeleton height={sizes.skeleton.card} radius={radius['2xl']} />
      ) : options.error ? (
        <Card>
          <ErrorState message={options.error} onRetry={() => void options.refetch()} />
        </Card>
      ) : (
        <Card style={styles.form}>
          {contracts.length > 0 ? (
            <SelectField
              label="Căn hộ / hợp đồng"
              value={contractName}
              placeholder="Chọn căn hộ (không bắt buộc)"
              onPress={() => setPickerOpen(true)}
            />
          ) : null}

          {categories.length > 0 ? (
            <View style={styles.field}>
              <Text variant="captionStrong" weight="semibold" color={semantic.textSecondary}>
                Loại yêu cầu
              </Text>
              <View style={styles.chips} role="radiogroup" aria-label="Loại yêu cầu">
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    size="sm"
                    label={c.name}
                    selected={categoryId === c.id}
                    onPress={() => setCategoryId((v) => (v === c.id ? undefined : c.id))}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Input
            ref={titleRef}
            label="Tiêu đề *"
            icon="document"
            placeholder="VD: Vòi nước nhà tắm bị rỉ"
            value={title}
            maxLength={REQUEST_TITLE_MAX}
            onChangeText={(t) => {
              setTitle(t);
              if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
            }}
            error={errors.title}
            returnKeyType="next"
          />

          <Input
            label="Nội dung"
            placeholder="Mô tả chi tiết vấn đề hoặc đề nghị của bạn…"
            value={content}
            multiline
            maxLength={REQUEST_CONTENT_MAX}
            onChangeText={(t) => {
              setContent(t);
              if (errors.content) setErrors((e) => ({ ...e, content: undefined }));
            }}
            error={errors.content}
            hint={`${content.length}/${REQUEST_CONTENT_MAX}`}
          />

          <View style={styles.field}>
            <View style={styles.attachHead}>
              <Text variant="captionStrong" weight="semibold" color={semantic.textSecondary} style={styles.flex}>
                Ảnh / tệp đính kèm
              </Text>
              <Text variant="caption" color={semantic.textMuted} numeric>
                {files.length}/{REQUEST_FILES_MAX}
              </Text>
            </View>
            <AttachmentGrid
              files={files}
              max={REQUEST_FILES_MAX}
              disabled={!!sending}
              onAdd={() => (Platform.OS === 'web' ? void addFile('document') : setSourceOpen(true))}
              onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))}
            />
            <Text variant="caption" color={errors.files ? colors.danger[700] : semantic.textMuted}>
              {errors.files ?? `Ảnh JPG/PNG, PDF, Word, Excel · tối đa ${REQUEST_FILE_MAX_MB} MB mỗi tệp`}
            </Text>
          </View>
        </Card>
      )}

      <PickerDialog
        visible={pickerOpen}
        title="Căn hộ / hợp đồng"
        items={contractItems}
        value={selectedContract ?? ''}
        onSelect={(item) => {
          setContractTouched(true);
          setContractId(item.value || undefined);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
      <UploadSourceSheet
        visible={sourceOpen}
        title="Thêm ảnh / tệp"
        sources={pickSources}
        onClose={() => setSourceOpen(false)}
        onPick={(s) => {
          setSourceOpen(false);
          // iOS không mở được trình chọn khi hộp chọn nguồn còn đang đóng → đợi đóng hẳn.
          InteractionManager.runAfterInteractions(() => setTimeout(() => void addFile(s), motion.slow));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  field: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  attachHead: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, minWidth: 0 },
});
