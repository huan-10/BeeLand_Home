import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { hitSlop, interactive, semantic, spacing } from '@/theme';

export interface SectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function Section({ title, actionLabel, onAction, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="h3" accessibilityRole="header">
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} accessibilityRole="link" hitSlop={hitSlop} style={[styles.action, interactive]}>
            <Text variant="smallMedium" color={semantic.textBrand}>
              {actionLabel}
            </Text>
            <Icon name="chevron-forward" size="sm" color={semantic.textBrand} />
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
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing['2xs'] },
});
