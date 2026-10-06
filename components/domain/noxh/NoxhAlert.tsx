import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { radius, spacing, toneColors, type IconName, type Tone } from '@/theme';

export interface NoxhAlertProps {
  tone: Tone;
  icon: IconName;
  title: string;
  message?: string | null;
  children?: ReactNode;
}

/** Khối thông báo pastel theo sắc thái (Cần bổ sung · Không đạt · Chưa nộp…) — icon + chữ, không chỉ dựa vào màu. */
export function NoxhAlert({ tone, icon, title, message, children }: NoxhAlertProps) {
  const c = toneColors[tone];
  return (
    <View style={[styles.box, { backgroundColor: c.bg }]} role={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}>
      <Icon name={icon} size="md" color={c.fg} />
      <View style={styles.text}>
        <Text variant="bodyStrong" weight="semibold" color={c.fg}>
          {title}
        </Text>
        {message ? (
          <Text variant="caption" color={c.fg}>
            {message}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms, padding: spacing.md, borderRadius: radius.xl },
  text: { flex: 1, minWidth: 0, gap: spacing.xs },
});
