import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, fontSizes, resolveFontFamily, sizes, spacing } from '@/theme';

export interface LogoProps {
  size?: keyof typeof sizes.logo;
  /** Hiển thị chữ "BeeSky" bên cạnh biểu tượng. */
  withWordmark?: boolean;
  /** Dùng trên nền cam: biểu tượng trắng, chữ trắng. */
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
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="BeeSky">
      <LinearGradient
        colors={inverted ? [colors.white, colors.primary[50]] : [colors.primary[400], colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mark, { width: box, height: box, borderRadius: box * 0.3 }]}>
        <Text style={textStyle} color={inverted ? colors.primary[600] : colors.white}>
          B
        </Text>
      </LinearGradient>
      {withWordmark ? (
        <Text style={textStyle}>
          <Text style={textStyle} color={inverted ? colors.white : colors.gray[900]}>
            Bee
          </Text>
          <Text style={textStyle} color={inverted ? colors.primary[100] : colors.primary[500]}>
            Sky
          </Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: { alignItems: 'center', justifyContent: 'center' },
});
