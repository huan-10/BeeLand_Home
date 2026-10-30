import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { Button, Dialog, Icon, Input, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { radius, semantic, spacing, toneColors } from '@/theme';

export interface DeleteAccountDialogProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Xoá tài khoản (Apple 5.1.1(v)): cảnh báo những gì bị xoá / giữ lại, xác nhận bằng mật khẩu hiện tại.
 * Thành công → AuthContext đăng xuất, route guard đưa về màn Đăng nhập.
 */
export function DeleteAccountDialog({ visible, onClose }: DeleteAccountDialogProps) {
  const { deleteAccount } = useAuth();
  const { submit, submitting } = useFormSubmit(deleteAccount);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const ref = useRef<TextInput>(null);

  const close = () => {
    if (submitting) return;
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
    }
  };

  return (
    <Dialog
      visible={visible}
      title="Xóa tài khoản?"
      onClose={close}
      actions={
        <>
          <Button title="Hủy" variant="ghost" onPress={close} disabled={submitting} />
          <Button title="Xóa vĩnh viễn" variant="danger" leftIcon="trash" loading={submitting} onPress={() => void handleSubmit()} />
        </>
      }>
      <View style={styles.warning}>
        <Icon name="warning" size="sm" color={toneColors.danger.fg} />
        <Text variant="caption" color={toneColors.danger.fg} style={styles.flex}>
          Không thể hoàn tác. Tài khoản đăng nhập của số điện thoại này sẽ bị xóa ở mọi chủ đầu tư, bạn sẽ bị đăng xuất trên mọi thiết bị.
        </Text>
      </View>
      <Text variant="caption" color={semantic.textMuted}>
        Hợp đồng, lịch thanh toán, phiếu thu và hồ sơ nhà ở xã hội do chủ đầu tư quản lý theo quy định nên vẫn được lưu. Bạn có thể đăng ký lại bằng
        số điện thoại này bất cứ lúc nào.
      </Text>
      <Input
        ref={ref}
        label="Nhập mật khẩu để xác nhận"
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

const styles = StyleSheet.create({
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.ms,
    borderRadius: radius.xl,
    backgroundColor: toneColors.danger.bg,
  },
  flex: { flex: 1, minWidth: 0 },
});
