import { StyleSheet, View } from 'react-native';

import { borderWidth, semantic, spacing } from '@/theme';

import { Text } from './Text';

/** Đường kẻ ngang, tùy chọn chữ ở giữa (ví dụ "hoặc"). */
export function Divider({ label }: { label?: string }) {
  if (!label) return <View style={styles.line} />;
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text variant="caption" color={semantic.textMuted}>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  line: { flex: 1, height: borderWidth.hairline, backgroundColor: semantic.border },
});
