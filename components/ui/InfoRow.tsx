import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { borderWidth, semantic, spacing } from '@/theme';

import { Text } from './Text';

export interface InfoRowProps {
  label: string;
  value: ReactNode;
  last?: boolean;
}

/** Dòng nhãn – giá trị dùng trong các thẻ chi tiết. */
export function InfoRow({ label, value, last }: InfoRowProps) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Text variant="small" color={semantic.textMuted} style={styles.label}>
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text variant="smallMedium" align="right" style={styles.value}>
          {value}
        </Text>
      ) : (
        <View style={styles.valueNode}>{value}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.ms, gap: spacing.md },
  divider: { borderBottomWidth: borderWidth.hairline, borderBottomColor: semantic.borderSubtle },
  label: { flexShrink: 0 },
  value: { flex: 1 },
  valueNode: { flex: 1, alignItems: 'flex-end' },
});
