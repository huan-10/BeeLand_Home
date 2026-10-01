import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, interactive, radius, semantic, sizes, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
}

/** Ô đánh dấu có nhãn; cả hàng là vùng chạm (cao tối thiểu 44). */
export function Checkbox({ label, checked, onChange, error, disabled }: CheckboxProps) {
  const borderColor = error ? colors.danger[500] : checked ? semantic.brand : colors.gray[300];
  return (
    <View>
      <Pressable
        onPress={() => onChange(!checked)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked, disabled }}
        style={[styles.row, interactive]}>
        <View style={[styles.box, { borderColor, backgroundColor: checked ? semantic.brand : semantic.surface }]}>
          {checked ? <Icon name="checkmark" size="sm" color={semantic.textOnPrimary} /> : null}
        </View>
        <Text variant="small" color={semantic.textSecondary} style={styles.label}>
          {label}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" color={colors.danger[600]} role="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: sizes.touchTarget },
  box: {
    width: sizes.checkbox,
    height: sizes.checkbox,
    borderRadius: radius.xs,
    borderWidth: borderWidth.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flexShrink: 1 },
});
