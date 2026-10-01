import { StyleSheet, View } from 'react-native';

import { getInitials } from '@/lib/format';
import { colors, radius, sizes } from '@/theme';

import { Text } from './Text';

export function Avatar({ name, size = 'md' }: { name: string; size?: keyof typeof sizes.avatar }) {
  const box = sizes.avatar[size];
  return (
    <View style={[styles.avatar, { width: box, height: box }]} accessibilityLabel={`Ảnh đại diện ${name}`}>
      <Text variant={size === 'lg' ? 'title' : size === 'md' ? 'subhead' : 'captionStrong'} weight="bold" color={colors.primary[800]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: radius.full, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' },
});
