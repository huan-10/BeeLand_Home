import { useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { Button, Dialog, Input, Text, useToast } from '@/components/ui';
import { isValidCccd, normalizeCccd } from '@/lib/noxh';
import { getErrorMessage, updateCccd } from '@/services';
import { semantic } from '@/theme';

export interface UpdateCccdDialogProps {
  visible: boolean;
  /** Công ty có tài khoản NOXH cần bổ sung CCCD. */
  companyId: string | null;
  /** Gợi ý điền sẵn (CCCD trên hồ sơ app, nếu đủ 12 số). */
  defaultCccd?: string;
  onClose: () => void;
  /** Cập nhật xong → tiếp tục việc đang làm (tạo / nộp hồ sơ). */
  onUpdated: () => void;
}

/**
 * Đăng ký nhà ở xã hội bắt buộc có CCCD trên tài khoản. Tài khoản chưa có → khách tự khai 12 số
 * (`fn_portal_noxh_cap_nhat_cccd`: máy chủ chặn CCCD của khách hàng khác hoặc lệch hồ sơ khách).
 */
export function UpdateCccdDialog({ visible, companyId, defaultCccd, onClose, onUpdated }: UpdateCccdDialogProps) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const ref = useRef<TextInput>(null);
  const shown = touched ? value : (defaultCccd ?? '');

  const close = () => {
    setValue('');
    setTouched(false);
    setError(undefined);
    onClose();
  };

  const save = async () => {
    if (saving || !companyId) return;
    if (!isValidCccd(shown)) {
      setError('Số CCCD phải gồm 12 chữ số');
      requestAnimationFrame(() => ref.current?.focus());
      return;
    }
    setSaving(true);
    try {
      await updateCccd(companyId, normalizeCccd(shown));
      toast.show('Đã cập nhật CCCD', 'success');
      setValue('');
      setTouched(false);
      setError(undefined);
      onUpdated();
    } catch (e) {
      setError(getErrorMessage(e));
      requestAnimationFrame(() => ref.current?.focus());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      title="Cập nhật CCCD"
      onClose={close}
      actions={
        <>
          <Button title="Để sau" variant="ghost" onPress={close} disabled={saving} />
          <Button title="Cập nhật" leftIcon="idCard" loading={saving} onPress={() => void save()} />
        </>
      }>
      <Text variant="caption" color={semantic.textMuted}>
        Hồ sơ nhà ở xã hội được xác minh theo số Căn cước công dân. Tài khoản của bạn chưa có CCCD — vui lòng nhập số CCCD 12 chữ số để tiếp tục đăng ký.
      </Text>
      <Input
        ref={ref}
        label="Số CCCD"
        icon="idCard"
        value={shown}
        placeholder="12 chữ số"
        keyboardType="number-pad"
        maxLength={15}
        onChangeText={(t) => {
          setTouched(true);
          setValue(t);
          if (error) setError(undefined);
        }}
        error={error}
        hint="Sau khi cập nhật, muốn đổi CCCD phải liên hệ chủ đầu tư."
        returnKeyType="done"
        onSubmitEditing={() => void save()}
      />
    </Dialog>
  );
}
