import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AuthLayout } from '@/components/layout';
import { Button, FadeIn, Input, StateView, Text, TextLink } from '@/components/ui';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { hasErrors, validateForgotForm } from '@/lib/validation';
import { requestPasswordReset } from '@/services';
import { semantic, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const inputRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sentVia, setSentVia] = useState<'email' | 'sms' | null>(null);
  const { submit, submitting } = useFormSubmit(requestPasswordReset);

  const backToLogin = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  const handleSubmit = async () => {
    if (submitting) return;
    const validation = validateForgotForm(identifier);
    if (hasErrors(validation)) {
      setError(validation.identifier);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    const outcome = await submit(identifier.trim());
    if (outcome.ok) setSentVia(outcome.result.channel);
    else {
      setError(outcome.error.message);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const footer = (
    <View style={styles.footerRow}>
      <Text variant="caption" color={semantic.textMuted}>
        Nhớ mật khẩu rồi?
      </Text>
      <TextLink label="Đăng nhập" onPress={backToLogin} />
    </View>
  );

  if (sentVia) {
    return (
      <AuthLayout title="Kiểm tra hộp thư" footer={footer}>
        <FadeIn>
          <StateView
            icon={sentVia === 'email' ? 'mailOpen' : 'message'}
            tone="success"
            title="Đã gửi hướng dẫn"
            description={
              sentVia === 'email'
                ? `Nếu ${identifier.trim()} đã đăng ký, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu trong vài phút.`
                : `Nếu số ${identifier.trim()} đã đăng ký, bạn sẽ nhận được tin nhắn SMS hướng dẫn đặt lại mật khẩu.`
            }
            role="alert"
            action={<Button title="Quay lại đăng nhập" variant="secondary" onPress={backToLogin} />}
          />
        </FadeIn>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập số điện thoại hoặc email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu."
      footer={footer}>
      <FadeIn index={1} style={styles.fields}>
        <Input
          ref={inputRef}
          label="Số điện thoại hoặc email"
          icon="user"
          placeholder="VD: 0901 234 567"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="send"
          value={identifier}
          onChangeText={(t) => {
            setIdentifier(t);
            setError(undefined);
          }}
          onSubmitEditing={() => void handleSubmit()}
          error={error}
        />
        <Button title="Gửi hướng dẫn" size="lg" loading={submitting} onPress={() => void handleSubmit()} fullWidth />
      </FadeIn>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
