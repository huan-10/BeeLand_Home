import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  validateOtp,
  validateRegisterForm,
  type FormErrors,
  type RegisterField,
  type RegisterFormValues,
} from '@/lib/validation';
import { confirmRegistration, startRegistration, type RegistrationStart } from '@/services';
import { semantic, spacing } from '@/theme';

const FIELD_ORDER: RegisterField[] = ['phone', 'password', 'confirmPassword', 'acceptTerms'];

const initialValues: RegisterFormValues = {
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

export default function RegisterScreen() {
  const toast = useToast();
  const start = useFormSubmit(startRegistration);
  const confirm = useFormSubmit(confirmRegistration);
  const submitting = start.submitting || confirm.submitting;
  /** Bước 2 (nhập OTP) khi đã có phiên xác nhận. */
  const [otpStep, setOtpStep] = useState<RegistrationStart | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>();
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef<TextInput>(null);

  // Đếm ngược "Gửi lại mã".
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<RegisterField>>({});

  const summaryRef = useRef<FormErrorSummaryHandle>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  /** Chỉ gọi trong handler (không truy cập ref khi render). */
  const focusField = (field: string) => {
    const target = {
      phone: phoneRef,
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
    await sendOtp();
  };

  /** Bước 1 → 2: kiểm tra SĐT trong hồ sơ khách hàng và gửi OTP (cũng dùng cho "Gửi lại mã"). */
  const sendOtp = async () => {
    const outcome = await start.submit(values.phone);
    if (!outcome.ok) {
      if (otpStep) {
        setOtpError(outcome.error.message);
        return;
      }
      const field = FIELD_ORDER.find((f) => f === outcome.error.field) ?? 'phone';
      const next = { [field]: outcome.error.message };
      setErrors(next);
      focusAfterError(next);
      return;
    }
    setOtpStep(outcome.result);
    setOtp('');
    setOtpError(undefined);
    setResendIn(outcome.result.resendIn);
    requestAnimationFrame(() => otpRef.current?.focus());
  };

  /** Bước 2: xác nhận OTP → tạo tài khoản → về màn Đăng nhập. */
  const handleConfirm = async () => {
    if (submitting || !otpStep) return;
    const invalid = validateOtp(otp, otpStep.otpLength);
    if (invalid) {
      setOtpError(invalid);
      requestAnimationFrame(() => otpRef.current?.focus());
      return;
    }
    const outcome = await confirm.submit(otpStep.requestId, otp, values.password);
    if (!outcome.ok) {
      setOtpError(outcome.error.message);
      requestAnimationFrame(() => otpRef.current?.focus());
      return;
    }
    toast.show('Tạo tài khoản thành công. Vui lòng đăng nhập.', 'success');
    // Quay về màn Đăng nhập sẵn có trong stack (không tạo thêm bản sao), điền sẵn số điện thoại.
    router.dismissTo({ pathname: '/login', params: { identifier: values.phone.trim() } });
  };

  const footer = (
    <View style={styles.footerRow}>
      <Text variant="caption" color={semantic.textMuted}>
        Đã có tài khoản?
      </Text>
      <TextLink label="Đăng nhập" onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
    </View>
  );

  if (otpStep) {
    return (
      <AuthLayout
        title="Xác nhận số điện thoại"
        subtitle={`Nhập mã ${otpStep.otpLength} số đã gửi qua Zalo tới ${values.phone.trim()}.`}
        footer={footer}>
        <FadeIn index={1} style={styles.fields}>
          <Input
            ref={otpRef}
            label="Mã OTP"
            icon="lock"
            placeholder={'•'.repeat(otpStep.otpLength)}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={otpStep.otpLength}
            returnKeyType="done"
            value={otp}
            onChangeText={(t) => {
              setOtp(t.replace(/\D/g, ''));
              setOtpError(undefined);
            }}
            onSubmitEditing={() => void handleConfirm()}
            error={otpError}
          />
          <Button title="Xác nhận" size="lg" loading={confirm.submitting} onPress={() => void handleConfirm()} fullWidth />
          <View style={styles.otpActions}>
            {resendIn > 0 ? (
              <Text variant="caption" color={semantic.textMuted}>
                Gửi lại mã sau {resendIn} giây
              </Text>
            ) : (
              <TextLink label="Gửi lại mã" onPress={() => void sendOtp()} />
            )}
            <TextLink label="Đổi số điện thoại" onPress={() => setOtpStep(null)} />
          </View>
        </FadeIn>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Dùng số điện thoại đã đăng ký khi ký hợp đồng để theo dõi hợp đồng và lịch thanh toán."
      footer={footer}>
      <FormErrorSummary ref={summaryRef} errors={summaryItems.length > 1 ? summaryItems : []} onSelect={focusField} />

      <FadeIn index={1} style={styles.fields}>
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
          onSubmitEditing={() => focusField('password')}
          error={errors.phone}
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
        <Button title="Tiếp tục" size="lg" loading={start.submitting} onPress={() => void handleSubmit()} fullWidth />
      </FadeIn>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  otpActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
});
