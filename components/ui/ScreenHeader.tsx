import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, interactive, radius, semantic, sizes, spacing } from '@/theme';

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
          style={({ pressed }) => [styles.back, interactive, pressed && styles.backPressed]}>
          <Icon name="chevron-back" size="lg" color={colors.gray[800]} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <Text variant="h1" numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" color={semantic.textMuted} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, paddingVertical: spacing.sm },
  back: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.md,
    backgroundColor: semantic.surface,
    borderWidth: borderWidth.hairline,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { backgroundColor: colors.gray[100] },
  titles: { flex: 1, gap: spacing['2xs'] },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
