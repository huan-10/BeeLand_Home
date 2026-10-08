import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, fontSizes, radius, resolveFontFamily, sizes, spacing } from '@/theme';

const logoMark = require('@/assets/images/logo.png');

export interface LogoProps {
  size?: keyof typeof sizes.logo;
  /** Hiển thị chữ "Beeland Plus" (tên app) bên cạnh biểu tượng. */
  withWordmark?: boolean;
  /** Dùng trên nền đậm/màu nhấn: chữ trắng (biểu tượng giữ nguyên màu). */
  inverted?: boolean;
}

const wordmarkSize: Record<keyof typeof sizes.logo, keyof typeof fontSizes> = {
  sm: 'body',
  md: 'heading',
  lg: 'title',
  xl: 'title',
};

export function Logo({ size = 'md', withWordmark = true, inverted = false }: LogoProps) {
  const box = sizes.logo[size];
  const textStyle = [fontSizes[wordmarkSize[size]], { fontFamily: resolveFontFamily('bold') }];
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="Beeland Plus">
      {/* Ảnh biểu tượng nền trắng, cắt sát từ assets/images/anh-logo.png; bo góc để thành ô trắng gọn trên nền đậm. */}
      <Image source={logoMark} style={[styles.mark, { width: box, height: box }]} resizeMode="contain" accessibilityIgnoresInvertColors />
      {withWordmark ? (
        <Text style={textStyle}>
          <Text style={textStyle} color={inverted ? colors.white : colors.gray[900]}>
            Beeland{' '}
          </Text>
          <Text style={textStyle} color={inverted ? colors.primary[100] : colors.primary[500]}>
            Plus
          </Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: { borderRadius: radius.sm },
});
