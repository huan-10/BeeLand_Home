import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, FadeIn, Icon, Text } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, layout, radius, semantic, sizes, spacing } from '@/theme';

import { Logo } from './Logo';

const cityImage = require('@/assets/images/auth-city.jpg');

export const AUTH_SLOGAN = 'An cư vững tâm, minh bạch từng đợt thanh toán';

const features = ['Theo dõi tiến độ hợp đồng', 'Nhắc lịch thanh toán đúng hạn', 'Phiếu thu điện tử, tra cứu mọi lúc'];

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Nội dung dưới form (ví dụ: link Đăng ký / Quay lại đăng nhập). */
  footer?: ReactNode;
}

/**
 * Khung chung cho Đăng nhập / Đăng ký / Quên mật khẩu.
 * Mobile: ảnh khu đô thị phía trên mờ dần vào nền + form một cột.
 * Desktop (≥1024px): 2 cột — trái ảnh thương hiệu phủ gradient cam đậm → nâu đen ink, phải form trong thẻ tối đa 440px.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  // 2 cột từ 1024px; 768–1023px dùng 1 cột với thẻ form căn giữa để form không bị bóp hẹp.
  const { isDesktop: twoColumn } = useBreakpoint();
  const insets = useSafeAreaInsets();

  const header = (
    <FadeIn style={styles.header}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" color={semantic.textMuted}>
          {subtitle}
        </Text>
      ) : null}
    </FadeIn>
  );

  if (twoColumn) {
    return (
      <View style={styles.split}>
        <ImageBackground source={cityImage} resizeMode="cover" style={styles.brandPanel} accessibilityIgnoresInvertColors>
          <LinearGradient
            colors={[colors.overlay.brandTint, colors.overlay.brandTintStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.4, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.brandContent]}>
            <Logo size="lg" inverted />
            <FadeIn style={styles.brandBody}>
              <Text variant="display" color={semantic.textInverse}>
                {AUTH_SLOGAN}
              </Text>
              <Text variant="body" color={semantic.textInverse} style={styles.brandText}>
                Ứng dụng dành cho khách hàng BeeSky: hợp đồng, lịch thanh toán và phiếu thu trong một nơi.
              </Text>
              <View style={styles.features}>
                {features.map((f) => (
                  <View key={f} style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Icon name="check" size="sm" color={semantic.onInverse} strong />
                    </View>
                    <Text variant="bodyStrong" color={semantic.textInverse}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            </FadeIn>
            <Text variant="caption" color={semantic.textInverse}>
              © {new Date().getFullYear()} BeeSky
            </Text>
          </LinearGradient>
        </ImageBackground>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.formScrollWide} keyboardShouldPersistTaps="handled">
            <Card padding="xl" radius="3xl" shadow="raised" style={styles.formCard}>
              <View style={styles.form}>
                {header}
                {children}
              </View>
            </Card>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }} keyboardShouldPersistTaps="handled">
        <ImageBackground
          source={cityImage}
          resizeMode="cover"
          style={{ height: sizes.authHero.mobile + insets.top }}
          accessibilityIgnoresInvertColors>
          <LinearGradient
            // Tối nhẹ phía trên để chữ trắng dễ đọc, rồi mờ dần vào màu nền.
            colors={[colors.overlay.heroScrim, colors.overlay.heroScrim, colors.overlay.authFadeStart, colors.overlay.authFadeMid, semantic.bg]}
            locations={[0, 0.55, 0.7, 0.85, 1]}
            style={[StyleSheet.absoluteFill, styles.heroContent, { paddingTop: insets.top + spacing.lg }]}>
            <FadeIn style={styles.heroText}>
              <Logo size="lg" inverted />
              <Text variant="bodyStrong" color={semantic.textInverse} style={styles.heroSlogan}>
                {AUTH_SLOGAN}
              </Text>
            </FadeIn>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.mobileBody}>
          <Card padding="ml" radius="3xl" shadow="raised">
            <View style={styles.form}>
              {header}
              {children}
            </View>
          </Card>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.bg },
  flex: { flex: 1 },
  split: { flex: 1, flexDirection: 'row', backgroundColor: semantic.bg },
  brandPanel: { flex: 1, maxWidth: layout.brandPanelMaxWidth, overflow: 'hidden' },
  brandContent: { padding: spacing['2xl'], justifyContent: 'space-between' },
  brandBody: { gap: spacing.md },
  brandText: { maxWidth: layout.brandTextMaxWidth },
  features: { gap: spacing.ms, marginTop: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  featureIcon: {
    width: sizes.iconBox.sm,
    height: sizes.iconBox.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.inverseTrack,
  },
  formScrollWide: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  formCard: { width: '100%', maxWidth: layout.formMaxWidth, alignSelf: 'center' },
  form: { gap: spacing.md },
  header: { gap: spacing.xs },
  footer: { marginTop: spacing.ml, alignItems: 'center' },
  heroContent: { paddingHorizontal: layout.gutterMobile },
  heroText: { gap: spacing.ms },
  heroSlogan: { maxWidth: layout.messageMaxWidth },
  mobileBody: {
    marginTop: -spacing.xl,
    paddingHorizontal: layout.gutterMobile,
    width: '100%',
    maxWidth: layout.formMaxWidth + layout.gutterMobile * 2,
    alignSelf: 'center',
  },
});
