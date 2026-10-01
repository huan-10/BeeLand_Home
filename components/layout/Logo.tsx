import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radius } from '@/theme';

export interface LogoProps {
  size?: number;
  /** Hiển thị chữ "BeeSky" bên cạnh biểu tượng. */
  withWordmark?: boolean;
  inverted?: boolean;
}

export function Logo({ size = 40, withWordmark = true, inverted = false }: LogoProps) {
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="BeeSky">
      <LinearGradient
        colors={inverted ? [colors.white, colors.primary[50]] : [colors.primary[400], colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mark, { width: size, height: size, borderRadius: size * 0.3 }]}>
        <Text weight="bold" color={inverted ? colors.primary[600] : colors.white} style={{ fontSize: size * 0.55, lineHeight: size * 0.7 }}>
          B
        </Text>
      </LinearGradient>
      {withWordmark ? (
        <Text weight="bold" style={{ fontSize: size * 0.5, lineHeight: size * 0.65 }}>
          <Text weight="bold" color={inverted ? colors.white : colors.gray[900]} style={{ fontSize: size * 0.5 }}>
            Bee
          </Text>
          <Text weight="bold" color={inverted ? colors.primary[100] : colors.primary[500]} style={{ fontSize: size * 0.5 }}>
            Sky
          </Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
});
