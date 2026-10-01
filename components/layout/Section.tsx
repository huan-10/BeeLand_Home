import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { colors } from '@/theme';

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
        <Text variant="h3">{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} accessibilityRole="link" hitSlop={8} style={styles.action}>
            <Text variant="smallMedium" color={colors.primary[600]}>
              {actionLabel}
            </Text>
            <Icon name="chevron-forward" size={16} color={colors.primary[600]} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
