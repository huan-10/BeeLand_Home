import { StyleSheet, View } from 'react-native';

import { Icon, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { borderWidth, colors, interactive, opacity, radius, semantic, sizes, spacing } from '@/theme';

export interface SelectFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onPress: () => void;
}

/** Ô chọn (mở `PickerDialog`) — cùng hình khối "mềm" với `Input`: nền `surfaceSunken`, bo `lg`, cao 48. */
export function SelectField({ label, value, placeholder, error, disabled, onPress }: SelectFieldProps) {
  const { hovered, hoverProps } = useHover();
  return (
    <View style={styles.wrapper}>
      <Text variant="captionStrong" weight="semibold" color={semantic.textSecondary}>
        {label}
      </Text>
      <Pressable
        {...hoverProps}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'chưa chọn'}`}
        aria-invalid={Boolean(error)}
        aria-disabled={disabled}
        style={[
          styles.field,
          interactive,
          { borderColor: error ? colors.danger[600] : hovered && !disabled ? semantic.borderStrong : semantic.surfaceSunken },
          disabled && styles.disabled,
        ]}>
        <Text variant="body" color={value ? semantic.text : semantic.placeholder} style={styles.flex}>
          {value || placeholder}
        </Text>
        <Icon name="chevronDown" size="sm" variant="bold" color={semantic.textMuted} />
      </Pressable>
      {error ? (
        <View style={styles.message} role="alert">
          <Icon name="alertCircle" size="sm" color={colors.danger[700]} />
          <Text variant="caption" color={colors.danger[700]}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    minHeight: sizes.control.md,
    paddingHorizontal: spacing.md,
    borderWidth: borderWidth.thick,
    borderRadius: radius.xl,
    backgroundColor: semantic.surfaceSunken,
  },
  disabled: { opacity: opacity.disabled },
  flex: { flex: 1, minWidth: 0 },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
