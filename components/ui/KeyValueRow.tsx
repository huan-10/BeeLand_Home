import * as Clipboard from 'expo-clipboard';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { interactive, radius, semantic, sizes, spacing } from '@/theme';

import { useHover } from '@/hooks/useHover';

import { Icon } from './Icon';
import { Text } from './Text';
import { useToast } from './Toast';

export interface KeyValueRowProps {
  label: string;
  value: ReactNode;
  /** Bỏ đường kẻ dưới (dòng cuối của nhóm). */
  last?: boolean;
  /** Chạm để sao chép giá trị (chỉ khi `value` là chữ/số): mã hợp đồng, mã phiếu, số tài khoản… */
  copyable?: boolean;
  /** Chữ số đều độ rộng cho số tiền, ngày, mã. */
  numeric?: boolean;
}

/** Dòng nhãn – giá trị trong thẻ chi tiết. `copyable`: cả dòng là nút sao chép, báo bằng toast. */
export function KeyValueRow({ label, value, last, copyable, numeric }: KeyValueRowProps) {
  const toast = useToast();
  const { hovered, hoverProps } = useHover();
  const text = typeof value === 'string' || typeof value === 'number' ? String(value) : null;

  const valueNode =
    text !== null ? (
      <Text variant="captionStrong" weight="semibold" align="right" numeric={numeric} style={styles.value}>
        {text}
      </Text>
    ) : (
      <View style={styles.valueNode}>{value}</View>
    );

  const labelNode = (
    <Text variant="caption" color={semantic.textMuted} style={styles.label}>
      {label}
    </Text>
  );

  if (copyable && text !== null) {
    const copy = async () => {
      await Clipboard.setStringAsync(text);
      toast.show(`Đã sao chép ${label.toLowerCase()}`, 'success');
    };
    return (
      <Pressable
        onPress={() => void copy()}
        {...hoverProps}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}`}
        accessibilityHint="Chạm để sao chép"
        style={({ pressed }) => [styles.row, styles.copyRow, !last && styles.divider, interactive, (hovered || pressed) && styles.copyActive]}>
        {labelNode}
        {valueNode}
        <Icon name="copy" size="sm" color={hovered ? semantic.textBrand : semantic.iconMuted} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, !last && styles.divider]}>
      {labelNode}
      {valueNode}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.ms, gap: spacing.md, minHeight: sizes.touchTarget },
  copyRow: { gap: spacing.sm, marginHorizontal: -spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md },
  copyActive: { backgroundColor: semantic.surfaceMuted },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: semantic.border },
  label: { flexShrink: 0, maxWidth: '50%' },
  value: { flex: 1 },
  valueNode: { flex: 1, alignItems: 'flex-end' },
});
