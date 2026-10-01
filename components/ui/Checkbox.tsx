import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, interactive, radius, semantic, sizes, spacing } from '@/theme';

import { useHover } from '@/hooks/useHover';

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
  const { hovered, hoverProps } = useHover();
  const borderColor = error ? colors.danger[600] : checked || hovered ? semantic.action : semantic.textMuted;
  return (
    <View>
      <Pressable
        onPress={() => onChange(!checked)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        aria-checked={checked}
        aria-disabled={!!disabled}
        {...hoverProps}
        style={[styles.row, interactive]}>
        <View
          style={[
            styles.box,
            { borderColor, backgroundColor: checked ? (hovered ? semantic.actionHover : semantic.action) : hovered ? colors.primary[50] : semantic.surface },
          ]}>
          {checked ? <Icon name="check" size="sm" color={semantic.textOnAction} strong /> : null}
        </View>
        <Text variant="caption" color={semantic.textSecondary} style={styles.label}>
          {label}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" color={colors.danger[700]} role="alert">
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
    borderRadius: radius.sm,
    borderWidth: borderWidth.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flexShrink: 1 },
});
