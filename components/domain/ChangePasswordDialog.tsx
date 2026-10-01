import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { Button, Dialog, Input, Text, useToast } from '@/components/ui';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import {
  MIN_PASSWORD_LENGTH,
  hasErrors,
  validateChangePasswordForm,
  type ChangePasswordField,
  type ChangePasswordValues,
  type FormErrors,
} from '@/lib/validation';
import { changePassword } from '@/services';
import { semantic, spacing } from '@/theme';

const empty: ChangePasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' };
const ORDER: ChangePasswordField[] = ['currentPassword', 'newPassword', 'confirmPassword'];

export interface ChangePasswordDialogProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

/** Đổi mật khẩu (chỉ giao diện): kiểm tra form, gọi `changePassword` (TODO backend), lỗi gắn đúng ô. */
export function ChangePasswordDialog({ visible, userId, onClose }: ChangePasswordDialogProps) {
  const toast = useToast();
  const { submit, submitting } = useFormSubmit(changePassword);
  const [values, setValues] = useState<ChangePasswordValues>(empty);
  const [errors, setErrors] = useState<FormErrors<ChangePasswordField>>({});
  const currentRef = useRef<TextInput>(null);
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const focusField = (f: ChangePasswordField) =>
    ({ currentPassword: currentRef, newPassword: newRef, confirmPassword: confirmRef })[f].current?.focus();

  const set = (f: ChangePasswordField, v: string) => {
    setValues((s) => ({ ...s, [f]: v }));
    if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }));
  };

  const close = () => {
    setValues(empty);
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const validation = validateChangePasswordForm(values);
    setErrors(validation);
    const first = ORDER.find((f) => validation[f]);
    if (hasErrors(validation) && first) {
      requestAnimationFrame(() => focusField(first));
      return;
    }
    const outcome = await submit(userId, values.currentPassword, values.newPassword);
    if (!outcome.ok) {
      const field = ORDER.find((f) => f === outcome.error.field) ?? 'currentPassword';
      setErrors({ [field]: outcome.error.message });
      requestAnimationFrame(() => focusField(field));
      return;
    }
    toast.show(outcome.result.message, outcome.result.status === 'changed' ? 'success' : 'info');
    close();
  };

  return (
    <Dialog
      visible={visible}
      title="Đổi mật khẩu"
      onClose={close}
      actions={
        <>
          <Button title="Hủy" variant="ghost" onPress={close} disabled={submitting} />
          <Button title="Lưu mật khẩu" leftIcon="lock" loading={submitting} onPress={() => void handleSubmit()} />
        </>
      }>
      <Text variant="caption" color={semantic.textMuted}>
        Mật khẩu mới cần ít nhất {MIN_PASSWORD_LENGTH} ký tự và khác mật khẩu hiện tại.
      </Text>
      <View style={styles.fields}>
        <Input
          ref={currentRef}
          label="Mật khẩu hiện tại"
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          value={values.currentPassword}
          onChangeText={(t) => set('currentPassword', t)}
          onSubmitEditing={() => newRef.current?.focus()}
          error={errors.currentPassword}
        />
        <Input
          ref={newRef}
          label="Mật khẩu mới"
          password
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          value={values.newPassword}
          onChangeText={(t) => set('newPassword', t)}
          onSubmitEditing={() => confirmRef.current?.focus()}
          error={errors.newPassword}
        />
        <Input
          ref={confirmRef}
          label="Nhập lại mật khẩu mới"
          password
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          value={values.confirmPassword}
          onChangeText={(t) => set('confirmPassword', t)}
          onSubmitEditing={() => void handleSubmit()}
          error={errors.confirmPassword}
        />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
});
