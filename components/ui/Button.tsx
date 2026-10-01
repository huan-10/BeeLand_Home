import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, type IconName } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<ButtonVariant, { bg: string; pressedBg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary[500], pressedBg: colors.primary[600], fg: colors.white, border: colors.primary[500] },
  secondary: { bg: colors.primary[50], pressedBg: colors.primary[100], fg: colors.primary[700], border: colors.primary[100] },
  ghost: { bg: colors.transparent, pressedBg: colors.gray[100], fg: colors.gray[700], border: colors.transparent },
  danger: { bg: colors.white, pressedBg: colors.danger[50], fg: colors.danger[600], border: colors.danger[100] },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; icon: number; text: 'smallMedium' | 'bodyMedium' }> = {
  sm: { height: 36, paddingHorizontal: 12, icon: 16, text: 'smallMedium' },
  md: { height: 46, paddingHorizontal: 16, icon: 18, text: 'bodyMedium' },
  lg: { height: 54, paddingHorizontal: 20, icon: 20, text: 'bodyMedium' },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth,
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          backgroundColor: pressed ? v.pressedBg : v.bg,
          borderColor: v.border,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <Icon name={leftIcon} size={s.icon} color={v.fg} /> : null}
          <Text variant={s.text} weight="semibold" color={v.fg} numberOfLines={1}>
            {title}
          </Text>
          {rightIcon ? <Icon name={rightIcon} size={s.icon} color={v.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
});
