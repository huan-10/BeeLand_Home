import { useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { Button, Dialog, Input, Text, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { semantic } from '@/theme';

export interface ConnectNoxhDialogProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

/**
 * Kết nối Nhà ở xã hội cho phiên đăng nhập cũ: CÙNG tài khoản, chỉ cần mật khẩu hiện tại để lấy phiên website NOXH
 * (app không lưu mật khẩu). Không phải đăng ký mới.
 */
export function ConnectNoxhDialog({ visible, onClose, onConnected }: ConnectNoxhDialogProps) {
  const { connectNoxh } = useAuth();
  const toast = useToast();
  const { submit, submitting } = useFormSubmit(connectNoxh);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const ref = useRef<TextInput>(null);

  const close = () => {
    setPassword('');
    setError(undefined);
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      requestAnimationFrame(() => ref.current?.focus());
      return;
    }
    const outcome = await submit(password);
    if (!outcome.ok) {
      setError(outcome.error.message);
      requestAnimationFrame(() => ref.current?.focus());
      return;
    }
    toast.show('Đã kết nối Nhà ở xã hội', 'success');
    setPassword('');
    setError(undefined);
    onClose();
    onConnected?.();
  };

  return (
    <Dialog
      visible={visible}
      title="Kết nối Nhà ở xã hội"
      onClose={close}
      actions={
        <>
          <Button title="Để sau" variant="ghost" onPress={close} disabled={submitting} />
          <Button title="Kết nối" leftIcon="shieldCheck" loading={submitting} onPress={() => void handleSubmit()} />
        </>
      }>
      <Text variant="caption" color={semantic.textMuted}>
        Tài khoản Nhà ở xã hội dùng chung tài khoản bạn đang đăng nhập. Nhập mật khẩu hiện tại để xem hồ sơ, nộp giấy tờ và bốc thăm.
      </Text>
      <Input
        ref={ref}
        label="Mật khẩu hiện tại"
        icon="lock"
        password
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (error) setError(undefined);
        }}
        error={error}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => void handleSubmit()}
      />
    </Dialog>
  );
}
