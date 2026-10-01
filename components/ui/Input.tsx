import { forwardRef, useId, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import {
  borderWidth,
  colors,
  fontSizes,
  hitSlop,
  interactive,
  radius,
  resolveFontFamily,
  semantic,
  shadows,
  sizes,
  spacing,
  type IconName,
} from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  /** Hiển thị nút ẩn/hiện mật khẩu. */
  password?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, icon, error, hint, password, style, onFocus, onBlur, editable = true, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(true);
  const messageId = useId();

  const borderColor = error ? colors.danger[500] : focused ? semantic.focusRing : semantic.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="smallMedium" color={semantic.textSecondary}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.field, { borderColor }, focused && !error && styles.focused, !editable && styles.disabled]}>
        {icon ? <Icon name={icon} color={focused ? semantic.brand : semantic.iconMuted} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label ?? rest.placeholder}
          aria-describedby={error || hint ? messageId : undefined}
          aria-invalid={Boolean(error)}
          placeholderTextColor={semantic.textMuted}
          secureTextEntry={password ? secure : rest.secureTextEntry}
          editable={editable}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...rest}
        />
        {password ? (
          <Pressable
            onPress={() => setSecure((s) => !s)}
            hitSlop={hitSlop}
            style={[styles.toggle, interactive]}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}>
            <Icon name={secure ? 'eye-outline' : 'eye-off-outline'} color={semantic.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.message} nativeID={messageId} accessibilityLiveRegion="polite" role="alert">
          <Icon name="alert-circle" size="sm" color={colors.danger[600]} />
          <Text variant="caption" color={colors.danger[600]}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" color={semantic.textMuted} nativeID={messageId}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    height: sizes.control.md,
    paddingHorizontal: spacing.md,
    borderWidth: borderWidth.thick,
    borderRadius: radius.md,
    backgroundColor: semantic.surface,
  },
  focused: shadows.focusHalo,
  disabled: { backgroundColor: semantic.surfaceMuted },
  input: {
    flex: 1,
    height: '100%',
    color: semantic.text,
    fontFamily: resolveFontFamily('body', 'regular'),
    // 16px trở lên để iOS không tự phóng to khi focus.
    ...fontSizes.base,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  toggle: { minWidth: sizes.icon.lg, alignItems: 'center', justifyContent: 'center' },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
