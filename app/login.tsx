import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { AuthLayout } from '@/components/layout';
import {
  Button,
  Checkbox,
  Divider,
  FadeIn,
  FormErrorSummary,
  Icon,
  Input,
  Text,
  TextLink,
  useToast,
  type FormErrorItem,
  type FormErrorSummaryHandle,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { useHover } from '@/hooks/useHover';
import { hasErrors, validateLoginForm, type FormErrors, type LoginField } from '@/lib/validation';
import { demoAccountHint } from '@/services';
import { borderWidth, interactive, opacity, radius, semantic, spacing, toneColors } from '@/theme';

const COMING_SOON = 'Tính năng sắp ra mắt';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const toast = useToast();
  const params = useLocalSearchParams<{ identifier?: string }>();

  const identifierRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const summaryRef = useRef<FormErrorSummaryHandle>(null);

  const [identifier, setIdentifier] = useState(params.identifier ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FormErrors<LoginField>>({});
  const { submit, submitting } = useFormSubmit(signIn);

  // Điền sẵn khi quay lại từ màn Đăng ký (cập nhật state theo params ngay trong render).
  const [prefilledFrom, setPrefilledFrom] = useState(params.identifier);
  if (params.identifier !== prefilledFrom) {
    setPrefilledFrom(params.identifier);
    if (params.identifier) setIdentifier(params.identifier);
  }

  const focusField = (field: string) => (field === 'password' ? passwordRef : identifierRef).current?.focus();

  const summaryItems: FormErrorItem[] = (['identifier', 'password'] as const).flatMap((field) => {
    const message = errors[field];
    return message ? [{ field, message }] : [];
  });

  /** Skill (focus-management): nhiều lỗi → focus bảng tóm tắt; một lỗi → focus ô lỗi. */
  const focusAfterError = (next: FormErrors<LoginField>) => {
    const fields = (['identifier', 'password'] as const).filter((f) => next[f]);
    requestAnimationFrame(() => {
      if (fields.length > 1) summaryRef.current?.focus();
      else if (fields[0]) focusField(fields[0]);
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const validation = validateLoginForm(identifier, password);
    setErrors(validation);
    if (hasErrors(validation)) {
      focusAfterError(validation);
      return;
    }
    const outcome = await submit(identifier.trim(), password, remember);
    if (!outcome.ok) {
      const field: LoginField = outcome.error.field === 'identifier' ? 'identifier' : 'password';
      const next = { [field]: outcome.error.message };
      setErrors(next);
      focusAfterError(next);
    }
    // Thành công: AuthContext đổi trạng thái → route guard chuyển vào Trang chủ.
  };

  const clearError = (field: LoginField) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const demoHover = useHover();

  const fillDemo = () => {
    if (!demoAccountHint) return;
    setIdentifier(demoAccountHint.email);
    setPassword(demoAccountHint.password);
    setErrors({});
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng bạn trở lại! Đăng nhập để xem hợp đồng và lịch thanh toán."
      footer={
        <View style={styles.footerRow}>
          <Text variant="caption" color={semantic.textMuted}>
            Chưa có tài khoản?
          </Text>
          <TextLink label="Đăng ký" onPress={() => router.push('/register')} />
        </View>
      }>
      <FormErrorSummary ref={summaryRef} errors={summaryItems.length > 1 ? summaryItems : []} onSelect={focusField} />

      <FadeIn index={1} style={styles.fields}>
        <Input
          ref={identifierRef}
          label="Số điện thoại hoặc email"
          icon="user"
          placeholder="VD: 0901 234 567"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          value={identifier}
          onChangeText={(t) => {
            setIdentifier(t);
            clearError('identifier');
          }}
          // Web: Enter gửi form ngay; mobile: chuyển sang ô mật khẩu.
          onSubmitEditing={() => (Platform.OS === 'web' ? void handleSubmit() : passwordRef.current?.focus())}
          error={errors.identifier}
        />
        <Input
          ref={passwordRef}
          label="Mật khẩu"
          icon="lock"
          placeholder="Nhập mật khẩu"
          password
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            clearError('password');
          }}
          onSubmitEditing={() => void handleSubmit()}
          error={errors.password}
        />

        <View style={styles.optionsRow}>
          <Checkbox label="Ghi nhớ đăng nhập" checked={remember} onChange={setRemember} />
          <TextLink label="Quên mật khẩu?" onPress={() => router.push('/forgot-password')} />
        </View>

        <Button title="Đăng nhập" size="lg" loading={submitting} onPress={() => void handleSubmit()} fullWidth />
      </FadeIn>

      <FadeIn index={2} style={styles.fields}>
        <Divider label="hoặc tiếp tục với" />
        <View style={styles.socialRow}>
          <Button
            title="Google"
            variant="outline"
            brand="google"
            style={styles.social}
            onPress={() => toast.show(COMING_SOON)}
            accessibilityHint={COMING_SOON}
          />
          <Button
            title="Apple"
            variant="outline"
            brand="apple"
            style={styles.social}
            onPress={() => toast.show(COMING_SOON)}
            accessibilityHint={COMING_SOON}
          />
        </View>

        {demoAccountHint ? (
          <Pressable
            onPress={fillDemo}
            accessibilityRole="button"
            accessibilityLabel={`Dùng tài khoản demo ${demoAccountHint.email}, mật khẩu ${demoAccountHint.password}`}
            {...demoHover.hoverProps}
            style={({ pressed }) => [styles.demo, interactive, demoHover.hovered && styles.demoHover, pressed && styles.demoPressed]}>
            <Icon name="info" color={toneColors.info.fg} />
            <View style={styles.flex}>
              <Text variant="captionStrong" weight="semibold" color={toneColors.info.fg}>
                Tài khoản dùng thử
              </Text>
              <Text variant="caption" color={toneColors.info.fg}>
                {demoAccountHint.email} hoặc {demoAccountHint.phone} · Mật khẩu: {demoAccountHint.password}
              </Text>
            </View>
            <Text variant="caption" weight="semibold" color={toneColors.info.fg}>
              Điền nhanh
            </Text>
          </Pressable>
        ) : null}
      </FadeIn>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
  flex: { flex: 1 },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  socialRow: { flexDirection: 'row', gap: spacing.ms },
  social: { flex: 1 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.ms,
    borderRadius: radius.lg,
    backgroundColor: toneColors.info.bg,
    borderWidth: borderWidth.hairline,
    borderColor: toneColors.info.border,
  },
  demoHover: { borderColor: toneColors.info.solid },
  demoPressed: { opacity: opacity.pressed },
});
