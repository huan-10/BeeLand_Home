import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/layout';
import { Button, Card, Icon, Input, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { hasErrors, validateLoginForm, type LoginFormErrors } from '@/lib/validation';
import { demoAccountHint, getErrorMessage } from '@/services';
import { borderWidth, colors, interactive, layout, opacity, radius, semantic, spacing, toneColors } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const validation = validateLoginForm(email, password);
    setErrors(validation);
    setFormError(null);
    if (hasErrors(validation)) return;
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setFormError(getErrorMessage(e));
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    if (!demoAccountHint) return;
    setEmail(demoAccountHint.email);
    setPassword(demoAccountHint.password);
    setErrors({});
    setFormError(null);
  };

  const form = (
    <View style={styles.form}>
      <View style={styles.formHeader}>
        {!isWide ? <Logo size="lg" /> : null}
        <Text variant="h1" style={styles.title}>
          Đăng nhập
        </Text>
        <Text variant="small" color={semantic.textMuted}>
          Quản lý hợp đồng, lịch thanh toán và phiếu thu của bạn mọi lúc, mọi nơi.
        </Text>
      </View>

      {formError ? (
        <View style={styles.alert} accessibilityRole="alert">
          <Icon name="alert-circle" color={toneColors.danger.fg} />
          <Text variant="small" color={toneColors.danger.fg} style={styles.flex}>
            {formError}
          </Text>
        </View>
      ) : null}

      <Input
        label="Email"
        icon="mail-outline"
        placeholder="email@vidu.vn"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
        }}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <Input
        ref={passwordRef}
        label="Mật khẩu"
        icon="lock-closed-outline"
        placeholder="Nhập mật khẩu"
        password
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
        }}
        onSubmitEditing={() => void submit()}
        error={errors.password}
      />

      <Button title="Đăng nhập" size="lg" loading={submitting} onPress={() => void submit()} fullWidth />

      {demoAccountHint ? (
      <Pressable onPress={fillDemo} accessibilityRole="button" style={({ pressed }) => [styles.demo, interactive, pressed && styles.demoPressed]}>
        <Icon name="information-circle" color={toneColors.info.fg} />
        <View style={styles.flex}>
          <Text variant="smallMedium" color={toneColors.info.fg}>
            Tài khoản dùng thử
          </Text>
          <Text variant="caption" color={toneColors.info.fg}>
            Email: {demoAccountHint.email} · Mật khẩu: {demoAccountHint.password}
          </Text>
        </View>
        <Text variant="caption" weight="semibold" color={toneColors.info.fg}>
          Điền nhanh
        </Text>
      </Pressable>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.split, !isWide && styles.column]}>
        {isWide ? (
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brand}>
            <Logo size="lg" inverted />
            <View style={styles.brandBody}>
              <Text variant="display" color={semantic.textOnPrimary}>
                Ngôi nhà của bạn,{'\n'}minh bạch từng đợt thanh toán.
              </Text>
              <Text variant="body" color={semantic.textOnPrimary} style={styles.brandText}>
                Theo dõi tiến độ hợp đồng, nhận nhắc lịch thanh toán và tra cứu phiếu thu điện tử trong một ứng dụng.
              </Text>
              <View style={styles.features}>
                {['Theo dõi tiến độ thanh toán', 'Nhắc hạn trước 30 ngày', 'Phiếu thu điện tử'].map((f) => (
                  <View key={f} style={styles.feature}>
                    <Icon name="checkmark-circle" color={semantic.textOnPrimary} />
                    <Text variant="bodyMedium" color={semantic.textOnPrimary}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Text variant="caption" color={semantic.textOnPrimary}>
              © {new Date().getFullYear()} BeeSky
            </Text>
          </LinearGradient>
        ) : null}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.formScroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}
          keyboardShouldPersistTaps="handled">
          {isWide ? <Card padding="xl" shadow="md" style={styles.formCard}>{form}</Card> : form}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.bg },
  split: { flex: 1, flexDirection: 'row' },
  column: { flexDirection: 'column' },
  flex: { flex: 1 },
  brand: { flex: 1, maxWidth: layout.brandPanelMaxWidth, padding: spacing['2xl'], justifyContent: 'space-between' },
  brandBody: { gap: spacing.md },
  brandText: { maxWidth: layout.brandTextMaxWidth },
  features: { gap: spacing.ms, marginTop: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  formScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.ml },
  formCard: { width: '100%', maxWidth: layout.formMaxWidth, alignSelf: 'center' },
  form: { width: '100%', maxWidth: layout.formMaxWidth, alignSelf: 'center', gap: spacing.md },
  formHeader: { gap: spacing.sm, marginBottom: spacing.xs },
  title: { marginTop: spacing.md },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.ms,
    borderRadius: radius.md,
    backgroundColor: toneColors.danger.bg,
    borderWidth: borderWidth.hairline,
    borderColor: toneColors.danger.border,
  },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.ms,
    borderRadius: radius.md,
    backgroundColor: toneColors.info.bg,
    borderWidth: borderWidth.hairline,
    borderColor: toneColors.info.border,
  },
  demoPressed: { opacity: opacity.pressed },
});
