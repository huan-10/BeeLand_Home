import { forwardRef, useId, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import {
  borderWidth,
  colors,
  fontSizes,
  interactive,
  radius,
  resolveFontFamily,
  semantic,
  shadows,
  sizes,
  spacing,
  type IconName,
} from '@/theme';

import { useHover } from '@/hooks/useHover';

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
  const toggleHover = useHover();
  const hoverField = useHover();

  const borderColor = error ? colors.danger[600] : focused ? semantic.focusRing : hoverField.hovered ? semantic.borderStrong : semantic.surfaceSunken;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="captionStrong" weight="semibold" color={semantic.textSecondary}>
          {label}
        </Text>
      ) : null}
      <View {...hoverField.hoverProps} style={[styles.field, { borderColor }, focused && styles.focusedField, focused && !error && styles.focused, !editable && styles.disabled]}>
        {icon ? <Icon name={icon} color={focused ? semantic.textBrand : semantic.textMuted} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label ?? rest.placeholder}
          aria-describedby={error || hint ? messageId : undefined}
          aria-invalid={Boolean(error)}
          placeholderTextColor={semantic.placeholder}
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
            {...toggleHover.hoverProps}
            style={[styles.toggle, interactive, toggleHover.hovered && styles.toggleHover]}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}>
            <Icon name={secure ? 'eye' : 'eyeOff'} color={semantic.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.message} nativeID={messageId} accessibilityLiveRegion="polite" role="alert">
          <Icon name="alertCircle" size="sm" color={colors.danger[700]} />
          <Text variant="caption" color={colors.danger[700]}>
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
    borderRadius: radius.lg,
    // Ô nhập "mềm": nền cát nhạt, viền cùng màu; focus → nền trắng, viền cam đậm + vòng sáng.
    backgroundColor: semantic.surfaceSunken,
  },
  focusedField: { backgroundColor: semantic.surface },
  focused: shadows.focusHalo,
  disabled: { backgroundColor: semantic.surfaceMuted },
  input: {
    flex: 1,
    // Web: <input> có độ rộng tối thiểu nội tại, cần 0 để không đẩy nút ẩn/hiện ra ngoài.
    minWidth: 0,
    height: '100%',
    color: semantic.text,
    fontFamily: resolveFontFamily('regular'),
    // 16px trở lên để iOS không tự phóng to khi focus.
    ...fontSizes.body,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  // Vùng chạm 44×44; lề âm để icon vẫn thẳng hàng mép phải ô nhập.
  toggle: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    marginRight: -spacing.ms,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleHover: { backgroundColor: semantic.border },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
