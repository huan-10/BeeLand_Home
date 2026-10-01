import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AuthLayout } from '@/components/layout';
import {
  Button,
  Checkbox,
  FadeIn,
  FormErrorSummary,
  Input,
  Text,
  TextLink,
  useToast,
  type FormErrorItem,
  type FormErrorSummaryHandle,
} from '@/components/ui';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import {
  MIN_PASSWORD_LENGTH,
  hasErrors,
  validateRegisterForm,
  type FormErrors,
  type RegisterField,
  type RegisterFormValues,
} from '@/lib/validation';
import { register } from '@/services';
import { semantic, spacing } from '@/theme';

const FIELD_ORDER: RegisterField[] = ['fullName', 'phone', 'email', 'password', 'confirmPassword', 'acceptTerms'];

const initialValues: RegisterFormValues = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

export default function RegisterScreen() {
  const toast = useToast();
  const { submit, submitting } = useFormSubmit(register);
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<RegisterField>>({});

  const summaryRef = useRef<FormErrorSummaryHandle>(null);
  const fullNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  /** Chỉ gọi trong handler (không truy cập ref khi render). */
  const focusField = (field: string) => {
    const target = {
      fullName: fullNameRef,
      phone: phoneRef,
      email: emailRef,
      password: passwordRef,
      confirmPassword: confirmPasswordRef,
    }[field];
    target?.current?.focus();
  };

  const set = <K extends keyof RegisterFormValues>(field: K, value: RegisterFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const summaryItems: FormErrorItem[] = FIELD_ORDER.flatMap((field) => {
    const message = errors[field];
    return message ? [{ field, message }] : [];
  });

  const focusAfterError = (next: FormErrors<RegisterField>) => {
    const fields = FIELD_ORDER.filter((f) => next[f]);
    requestAnimationFrame(() => {
      if (fields.length > 1) summaryRef.current?.focus();
      else if (fields[0]) focusField(fields[0]);
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const validation = validateRegisterForm(values);
    setErrors(validation);
    if (hasErrors(validation)) {
      focusAfterError(validation);
      return;
    }
    const outcome = await submit({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      password: values.password,
    });
    if (!outcome.ok) {
      const field = FIELD_ORDER.find((f) => f === outcome.error.field) ?? 'email';
      const next = { [field]: outcome.error.message };
      setErrors(next);
      focusAfterError(next);
      return;
    }
    toast.show('Đăng ký thành công. Vui lòng đăng nhập.', 'success');
    // Quay về màn Đăng nhập sẵn có trong stack (không tạo thêm bản sao), điền sẵn email.
    router.dismissTo({ pathname: '/login', params: { identifier: values.email.trim() } });
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Đăng ký để theo dõi hợp đồng và lịch thanh toán của bạn."
      footer={
        <View style={styles.footerRow}>
          <Text variant="caption" color={semantic.textMuted}>
            Đã có tài khoản?
          </Text>
          <TextLink label="Đăng nhập" onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
        </View>
      }>
      <FormErrorSummary ref={summaryRef} errors={summaryItems.length > 1 ? summaryItems : []} onSelect={focusField} />

      <FadeIn index={1} style={styles.fields}>
        <Input
          ref={fullNameRef}
          label="Họ và tên"
          icon="user"
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          returnKeyType="next"
          value={values.fullName}
          onChangeText={(t) => set('fullName', t)}
          onSubmitEditing={() => focusField('phone')}
          error={errors.fullName}
        />
        <Input
          ref={phoneRef}
          label="Số điện thoại"
          icon="phone"
          placeholder="0901 234 567"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          value={values.phone}
          onChangeText={(t) => set('phone', t)}
          onSubmitEditing={() => focusField('email')}
          error={errors.phone}
        />
        <Input
          ref={emailRef}
          label="Email"
          icon="mail"
          placeholder="ten@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          value={values.email}
          onChangeText={(t) => set('email', t)}
          onSubmitEditing={() => focusField('password')}
          error={errors.email}
        />
        <Input
          ref={passwordRef}
          label="Mật khẩu"
          icon="lock"
          placeholder="Tạo mật khẩu"
          password
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          hint={`Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
          value={values.password}
          onChangeText={(t) => set('password', t)}
          onSubmitEditing={() => focusField('confirmPassword')}
          error={errors.password}
        />
        <Input
          ref={confirmPasswordRef}
          label="Nhập lại mật khẩu"
          icon="lock"
          placeholder="Nhập lại mật khẩu"
          password
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          value={values.confirmPassword}
          onChangeText={(t) => set('confirmPassword', t)}
          onSubmitEditing={() => void handleSubmit()}
          error={errors.confirmPassword}
        />
        <Checkbox
          label="Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của BeeSky"
          checked={values.acceptTerms}
          onChange={(checked) => set('acceptTerms', checked)}
          error={errors.acceptTerms}
        />
        <Button title="Tạo tài khoản" size="lg" loading={submitting} onPress={() => void handleSubmit()} fullWidth />
      </FadeIn>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
