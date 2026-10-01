import { View } from 'react-native';

import { getInitials } from '@/lib/format';
import { colors } from '@/theme';

import { Text } from './Text';

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary[100],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text weight="bold" color={colors.primary[700]} style={{ fontSize: size * 0.38, lineHeight: size * 0.5 }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
