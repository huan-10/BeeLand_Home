import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { Button, Dialog, IconCircle, Input, Text, useToast } from '@/components/ui';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import type { CompanyOption } from '@/types';
import { semantic, spacing } from '@/theme';

export interface LinkCompanyDialogProps {
  /** Công ty mới có hồ sơ của khách (rỗng → ẩn hộp thoại). */
  companies: CompanyOption[];
  /** Xác minh mật khẩu hiện tại rồi liên kết; trả các công ty đã thêm. */
  onLink: (password: string) => Promise<CompanyOption[]>;
  /** "Để sau". */
  onDismiss: () => void;
}

/**
 * Hồ sơ của khách phát sinh ở công ty mới khi đang đăng nhập: nhập mật khẩu hiện tại để liên kết
 * (tài khoản ở công ty mới dùng CÙNG mật khẩu), rồi chuyển công ty ở mục Cá nhân.
 */
export function LinkCompanyDialog({ companies, onLink, onDismiss }: LinkCompanyDialogProps) {
  const toast = useToast();
  const { submit, submitting } = useFormSubmit(onLink);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const passwordRef = useRef<TextInput>(null);

  const close = () => {
    setPassword('');
    setError(undefined);
    onDismiss();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      requestAnimationFrame(() => passwordRef.current?.focus());
      return;
    }
    const outcome = await submit(password);
    if (!outcome.ok) {
      setError(outcome.error.message);
      requestAnimationFrame(() => passwordRef.current?.focus());
      return;
    }
    const names = outcome.result.map((c) => c.companyName).filter(Boolean).join(', ');
    toast.show(`Đã liên kết ${names || 'công ty mới'}. Chuyển công ty trong mục Cá nhân.`, 'success');
    setPassword('');
    setError(undefined);
  };

  return (
    <Dialog
      visible={companies.length > 0}
      title="Có hồ sơ ở công ty mới"
      onClose={close}
      actions={
        <>
          <Button title="Để sau" variant="ghost" onPress={close} disabled={submitting} />
          <Button title="Liên kết" leftIcon="building" loading={submitting} onPress={() => void handleSubmit()} />
        </>
      }>
      <Text variant="caption" color={semantic.textMuted}>
        Số điện thoại của bạn vừa có hồ sơ khách hàng tại công ty dưới đây. Nhập mật khẩu hiện tại để liên kết và xem hợp đồng ở công ty
        này.
      </Text>
      <View style={styles.list}>
        {companies.map((c) => (
          <View key={c.companyId} style={styles.row}>
            <IconCircle name="building" tone="primary" size="sm" />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{c.companyName || 'Công ty'}</Text>
              <Text variant="caption" color={semantic.textMuted}>
                {[c.customerName, c.customerCode].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <Input
        ref={passwordRef}
        label="Mật khẩu hiện tại"
        icon="lock"
        password
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (error) setError(undefined);
        }}
        onSubmitEditing={() => void handleSubmit()}
        error={error}
      />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, marginVertical: spacing.ms },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
});
