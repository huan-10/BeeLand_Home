import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { interactive, radius, semantic, shadows, sizes, spacing } from '@/theme';

import { useHover } from '@/hooks/useHover';

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
  const { hovered, hoverProps } = useHover();
  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          {...hoverProps}
          style={({ pressed }) => [styles.back, interactive, (pressed || hovered) && styles.backPressed]}>
          <Icon name="chevronLeft" size="lg" color={semantic.text} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={semantic.textMuted}>
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
    borderRadius: radius.full,
    backgroundColor: semantic.surface,
    ...shadows.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { backgroundColor: semantic.surfaceSunken },
  titles: { flex: 1, gap: spacing.xs },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
