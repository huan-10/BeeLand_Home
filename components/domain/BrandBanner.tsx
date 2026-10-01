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
}

/** Banner thương hiệu: ảnh khu đô thị phủ gradient cam, logo + thông điệp. Chỉ trang trí, không bấm được. */
export function BrandBanner({ title, subtitle }: BrandBannerProps) {
  const { isWide } = useBreakpoint();
  return (
    <ImageBackground
      source={cityImage}
      resizeMode="cover"
      style={[styles.banner, shadows.md]}
      imageStyle={styles.image}
      accessibilityIgnoresInvertColors>
      <LinearGradient
        // Trái đậm để chữ trắng dễ đọc, phải nhạt dần để thấy ảnh khu đô thị.
        colors={[colors.overlay.brandTintStrong, colors.overlay.brandTint, colors.overlay.brandTintSoft]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.content, { minHeight: isWide ? sizes.banner.wide : sizes.banner.mobile }]}>
        <Logo size="sm" inverted />
        <View style={styles.text}>
          <Text variant={isWide ? 'h1' : 'h2'} color={semantic.textOnPrimary}>
            {title}
          </Text>
          <Text variant="small" color={semantic.textOnPrimary}>
            {subtitle}
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.xl, overflow: 'hidden' },
  image: { borderRadius: radius.xl },
  content: { padding: spacing.ml, justifyContent: 'space-between', gap: spacing.ms },
  text: { gap: spacing.xs, maxWidth: layout.bannerTextMaxWidth },
});
