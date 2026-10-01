import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Hiển thị nút quay lại khi có. */
  onBack?: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
          <Icon name="chevron-back" size={22} color={colors.gray[800]} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <Text variant="h1" numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" color={colors.gray[500]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { backgroundColor: colors.gray[100] },
  titles: { flex: 1, gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
