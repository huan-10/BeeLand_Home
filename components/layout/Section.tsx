import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { interactive, opacity, semantic, sizes, spacing } from '@/theme';

export interface SectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function Section({ title, actionLabel, onAction, children }: SectionProps) {
  const { hovered, hoverProps } = useHover();
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="h3" accessibilityRole="header">
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="link"
            {...hoverProps}
            style={({ pressed }) => [styles.action, interactive, pressed && styles.pressed]}>
            <Text variant="smallMedium" weight="semibold" color={semantic.textBrand} style={hovered && styles.underline}>
              {actionLabel}
            </Text>
            <Icon name="chevronRight" size="sm" color={semantic.textBrand} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.ms },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: sizes.touchTarget },
  pressed: { opacity: opacity.pressed },
  underline: { textDecorationLine: 'underline' },
});
