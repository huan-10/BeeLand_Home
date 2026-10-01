import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/layout/Logo';
import { Text } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, layout, radius, semantic, shadows, sizes, spacing } from '@/theme';

const cityImage = require('@/assets/images/auth-city.jpg');

export interface BrandBannerProps {
  title: string;
  subtitle: string;
  /** Giãn hết chiều cao ô lưới (đặt cạnh thẻ tổng quan trên desktop). */
  fill?: boolean;
}

/** Banner thương hiệu: ảnh khu đô thị phủ gradient nâu đen ink → cam đậm, logo + thông điệp. Chỉ trang trí, không bấm được. */
export function BrandBanner({ title, subtitle, fill }: BrandBannerProps) {
  const { isWide } = useBreakpoint();
  return (
    <ImageBackground
      source={cityImage}
      resizeMode="cover"
      style={[styles.banner, shadows.soft, fill && styles.fill]}
      imageStyle={styles.image}
      accessibilityIgnoresInvertColors>
      <LinearGradient
        // Lớp phủ đậm trên toàn banner để chữ trắng luôn ≥ 4.5:1 (kể cả trên vùng sáng của ảnh) — kiểm trong tests/contrast.
        colors={[colors.overlay.brandTintStrong, colors.overlay.brandTint]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.content, fill && styles.fill, { minHeight: isWide ? sizes.banner.wide : sizes.banner.mobile }]}>
        <Logo size="sm" inverted />
        <View style={styles.text}>
          <Text variant="title" color={semantic.textInverse}>
            {title}
          </Text>
          <Text variant="caption" color={semantic.textInverse}>
            {subtitle}
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius['3xl'], overflow: 'hidden' },
  image: { borderRadius: radius['3xl'] },
  fill: { flex: 1 },
  content: { padding: spacing.lg, justifyContent: 'space-between', gap: spacing.ms },
  text: { gap: spacing.xs, maxWidth: layout.bannerTextMaxWidth },
});
