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
import { colors, radius, toneColors } from '@/theme';

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
        {!isWide ? <Logo size={44} /> : null}
        <Text variant="h1" style={styles.title}>
          Đăng nhập
        </Text>
        <Text variant="small" color={colors.gray[500]}>
          Quản lý hợp đồng, lịch thanh toán và phiếu thu của bạn mọi lúc, mọi nơi.
        </Text>
      </View>

      {formError ? (
        <View style={styles.alert} accessibilityRole="alert">
          <Icon name="alert-circle" size={18} color={toneColors.danger.fg} />
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
      <Pressable onPress={fillDemo} accessibilityRole="button" style={({ pressed }) => [styles.demo, pressed && styles.demoPressed]}>
        <Icon name="information-circle" size={20} color={colors.info[600]} />
        <View style={styles.flex}>
          <Text variant="smallMedium" color={colors.info[700]}>
            Tài khoản dùng thử
          </Text>
          <Text variant="caption" color={colors.info[700]}>
            Email: {demoAccountHint.email} · Mật khẩu: {demoAccountHint.password}
          </Text>
        </View>
        <Text variant="caption" weight="semibold" color={colors.info[600]}>
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
            colors={[colors.primary[400], colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brand}>
            <Logo size={44} inverted />
            <View style={styles.brandBody}>
              <Text variant="display" color={colors.white}>
                Ngôi nhà của bạn,{'\n'}minh bạch từng đợt thanh toán.
              </Text>
              <Text variant="body" color={colors.primary[50]} style={styles.brandText}>
                Theo dõi tiến độ hợp đồng, nhận nhắc lịch thanh toán và tra cứu phiếu thu điện tử trong một ứng dụng.
              </Text>
              <View style={styles.features}>
                {['Theo dõi tiến độ thanh toán', 'Nhắc hạn trước 30 ngày', 'Phiếu thu điện tử'].map((f) => (
                  <View key={f} style={styles.feature}>
                    <Icon name="checkmark-circle" size={20} color={colors.white} />
                    <Text variant="bodyMedium" color={colors.white}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Text variant="caption" color={colors.primary[100]}>
              © {new Date().getFullYear()} BeeSky
            </Text>
          </LinearGradient>
        ) : null}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.formScroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          {isWide ? <Card padding={32} shadow="md" style={styles.formCard}>{form}</Card> : form}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  split: { flex: 1, flexDirection: 'row' },
  column: { flexDirection: 'column' },
  flex: { flex: 1 },
  brand: { flex: 1, maxWidth: 560, padding: 48, justifyContent: 'space-between' },
  brandBody: { gap: 16 },
  brandText: { maxWidth: 420 },
  features: { gap: 12, marginTop: 16 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  formScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  formCard: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  form: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 18 },
  formHeader: { gap: 8, marginBottom: 4 },
  title: { marginTop: 16 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: toneColors.danger.bg,
    borderWidth: 1,
    borderColor: colors.danger[100],
  },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.info[50],
    borderWidth: 1,
    borderColor: colors.info[100],
  },
  demoPressed: { opacity: 0.8 },
});
