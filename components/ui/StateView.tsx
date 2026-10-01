import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout, radius, semantic, sizes, spacing, toneColors, type IconName, type Tone } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface StateViewProps {
  icon: IconName;
  tone: Tone;
  title: string;
  description?: string;
  action?: ReactNode;
  role?: 'alert';
}

/** Khung chung cho EmptyState / ErrorState: icon tròn pastel, tiêu đề, mô tả, hành động. */
export function StateView({ icon, tone, title, description, action, role }: StateViewProps) {
  return (
    <View style={styles.container} role={role}>
      <View style={[styles.iconWrap, { backgroundColor: toneColors[tone].bg }]}>
        <Icon name={icon} size="xl" color={toneColors[tone].fg} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="caption" color={semantic.textMuted} align="center" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['2xl'], paddingHorizontal: spacing.lg, gap: spacing.sm },
  iconWrap: {
    width: sizes.iconBox.hero,
    height: sizes.iconBox.hero,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  description: { maxWidth: layout.messageMaxWidth },
  action: { marginTop: spacing.ms },
});
