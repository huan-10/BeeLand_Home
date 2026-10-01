import { forwardRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontFamily, fontSizes, radius, type IconName } from '@/theme';

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

  const borderColor = error ? colors.danger[500] : focused ? colors.primary[500] : colors.gray[200];

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="smallMedium" color={colors.gray[700]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          { borderColor },
          focused && !error && styles.focused,
          !editable && styles.disabled,
        ]}>
        {icon ? <Icon name={icon} size={20} color={focused ? colors.primary[500] : colors.gray[400]} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.gray[400]}
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
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}>
            <Icon name={secure ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.gray[500]} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.message}>
          <Icon name="alert-circle" size={14} color={colors.danger[600]} />
          <Text variant="caption" color={colors.danger[600]}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" color={colors.gray[500]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  focused: { boxShadow: `0px 0px 0px 3px ${colors.primary[100]}` },
  disabled: { backgroundColor: colors.gray[50] },
  input: {
    flex: 1,
    height: '100%',
    color: colors.gray[900],
    fontFamily: fontFamily.regular,
    ...fontSizes.base,
    // Bỏ viền focus mặc định của trình duyệt.
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  message: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
