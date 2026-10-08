import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AuthLayout } from '@/components/layout';
import { Button, FadeIn, Input, StateView, Text, TextLink } from '@/components/ui';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import {
  NEW_PASSWORD_MIN_LENGTH,
  hasErrors,
  validateForgotForm,
  validateResetForm,
  type FormErrors,
  type ResetField,
} from '@/lib/validation';
import { confirmPasswordReset, startPasswordReset, type RegistrationStart } from '@/services';
import { semantic, spacing } from '@/theme';

/** Câu server (`fn_portal_app_otp_gui`) trả khi SĐT chưa có tài khoản → kèm link Đăng ký. */
const NOT_REGISTERED = 'Số điện thoại chưa đăng ký tài khoản.';
const RESET_FIELDS: ResetField[] = ['otp', 'password', 'confirmPassword'];

/**
 * Quên mật khẩu (OTP thật): (1) SĐT → gửi mã qua Zalo; (2) mã + mật khẩu mới → server kiểm mã, đặt mật khẩu cho tài khoản
 * ở mọi công ty có SĐT này; (3) xong → Đăng nhập (điền sẵn SĐT).
 */
export default function ForgotPasswordScreen() {
  const start = useFormSubmit(startPasswordReset);
  const confirm = useFormSubmit(confirmPasswordReset);
  const submitting = start.submitting || confirm.submitting;

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [otpStep, setOtpStep] = useState<RegistrationStart | null>(null);
  const [values, setValues] = useState<Record<ResetField, string>>({ otp: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors<ResetField>>({});
  const [resendIn, setResendIn] = useState(0);
  const [done, setDone] = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  /** Lượt gửi mã mới nhất — phản hồi của lượt cũ (đã "Đổi số" / gửi lại) bị bỏ qua. */
  const sendSeq = useRef(0);

  // Đếm ngược "Gửi lại mã".
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const backToLogin = () => (router.canGoBack() ? router.back() : router.replace('/login'));
  const goLogin = () => router.dismissTo({ pathname: '/login', params: { identifier: otpStep?.phone ?? phone.trim() } });

  const focusReset = (field: ResetField | undefined) => {
    const target = { otp: otpRef, password: passwordRef, confirmPassword: confirmRef }[field ?? 'otp'];
    requestAnimationFrame(() => target.current?.focus());
  };

  const set = (field: ResetField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  /** Bước 1 → 2 (cũng dùng cho "Gửi lại mã"): mỗi lần gửi là một mã mới, mã cũ bị huỷ. */
  const sendOtp = async () => {
    const seq = ++sendSeq.current;
    const outcome = await start.submit(phone.trim());
    if (seq !== sendSeq.current) return;
    if (!outcome.ok) {
      if (otpStep) setErrors({ otp: outcome.error.message });
      else {
        setPhoneError(outcome.error.message);
        requestAnimationFrame(() => phoneRef.current?.focus());
      }
      return;
    }
    setOtpStep(outcome.result);
    setValues((v) => ({ ...v, otp: '' }));
    setErrors({});
    setResendIn(outcome.result.resendIn);
    focusReset('otp');
  };

  const handleSend = async () => {
    if (submitting) return;
    const invalid = validateForgotForm(phone).identifier;
    if (invalid) {
      setPhoneError(invalid);
      requestAnimationFrame(() => phoneRef.current?.focus());
      return;
    }
    await sendOtp();
  };

  const handleReset = async () => {
    if (submitting || !otpStep) return;
    const validation = validateResetForm(values, otpStep.otpLength);
    setErrors(validation);
    if (hasErrors(validation)) {
      focusReset(RESET_FIELDS.find((f) => validation[f]));
      return;
    }
    const outcome = await confirm.submit(otpStep.requestId, values.otp, values.password);
    if (!outcome.ok) {
      const field = RESET_FIELDS.find((f) => f === outcome.error.field) ?? 'otp';
      setErrors({ [field]: outcome.error.message });
      focusReset(field);
      return;
    }
    setDone(true);
  };

  /** Đổi số: bỏ hẳn mã đang chờ (không gửi `otp_id` cũ lên xác minh). */
  const changePhone = () => {
    sendSeq.current += 1;
    setOtpStep(null);
    setValues({ otp: '', password: '', confirmPassword: '' });
    setErrors({});
    setResendIn(0);
  };

  const footer = (
    <View style={styles.footerRow}>
      <Text variant="caption" color={semantic.textMuted}>
        Nhớ mật khẩu rồi?
      </Text>
      <TextLink label="Đăng nhập" onPress={backToLogin} />
    </View>
  );

  if (done) {
    return (
      <AuthLayout title="Đặt lại mật khẩu" footer={footer}>
        <FadeIn>
          <StateView
            icon="checkCircle"
            tone="success"
            title="Đã đặt lại mật khẩu"
            description="Bạn có thể đăng nhập bằng mật khẩu mới."
            role="alert"
            action={<Button title="Đăng nhập" onPress={goLogin} />}
          />
        </FadeIn>
      </AuthLayout>
    );
  }

  if (otpStep) {
    return (
      <AuthLayout
        title="Đặt lại mật khẩu"
        subtitle={`Nhập mã ${otpStep.otpLength} số đã gửi qua Zalo tới ${otpStep.phone}.`}
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
            returnKeyType="next"
            value={values.otp}
            onChangeText={(t) => set('otp', t.replace(/\D/g, ''))}
            onSubmitEditing={() => focusReset('password')}
            error={errors.otp}
          />
          <Input
            ref={passwordRef}
            label="Mật khẩu mới"
            icon="lock"
            placeholder="Tạo mật khẩu mới"
            password
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            hint={`Tối thiểu ${NEW_PASSWORD_MIN_LENGTH} ký tự`}
            value={values.password}
            onChangeText={(t) => set('password', t)}
            onSubmitEditing={() => focusReset('confirmPassword')}
            error={errors.password}
          />
          <Input
            ref={confirmRef}
            label="Nhập lại mật khẩu"
            icon="lock"
            placeholder="Nhập lại mật khẩu mới"
            password
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            value={values.confirmPassword}
            onChangeText={(t) => set('confirmPassword', t)}
            onSubmitEditing={() => void handleReset()}
            error={errors.confirmPassword}
          />
          <Button title="Đặt lại mật khẩu" size="lg" loading={confirm.submitting} onPress={() => void handleReset()} fullWidth />
          <View style={styles.otpActions}>
            {resendIn > 0 || confirm.submitting ? (
              <Text variant="caption" color={semantic.textMuted}>
                {resendIn > 0 ? `Gửi lại mã sau ${resendIn} giây` : 'Đang xác nhận…'}
              </Text>
            ) : (
              <TextLink label="Gửi lại mã" onPress={() => void sendOtp()} />
            )}
            <TextLink label="Đổi số điện thoại" onPress={changePhone} />
          </View>
        </FadeIn>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập số điện thoại đã đăng ký, chúng tôi sẽ gửi mã xác nhận qua Zalo."
      footer={footer}>
      <FadeIn index={1} style={styles.fields}>
        <Input
          ref={phoneRef}
          label="Số điện thoại"
          icon="phone"
          placeholder="VD: 0901 234 567"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="send"
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            setPhoneError(undefined);
          }}
          onSubmitEditing={() => void handleSend()}
          error={phoneError}
        />
        {phoneError === NOT_REGISTERED ? (
          <View style={styles.footerRow}>
            <Text variant="caption" color={semantic.textMuted}>
              Chưa có tài khoản?
            </Text>
            <TextLink label="Đăng ký" onPress={() => router.replace('/register')} />
          </View>
        ) : null}
        <Button title="Gửi mã xác nhận" size="lg" loading={start.submitting} onPress={() => void handleSend()} fullWidth />
      </FadeIn>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  otpActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
});
