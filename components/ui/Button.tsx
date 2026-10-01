import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  borderWidth,
  colors,
  interactive,
  opacity,
  radius,
  semantic,
  sizes,
  spacing,
  toneColors,
  type IconName,
  type IconSize,
} from '@/theme';

import { useHover } from '@/hooks/useHover';

import { Icon } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
  // Nền cam theo mockup; chữ gray-900 để đạt 7:1 (MASTER.md §1.4).
  primary: { bg: semantic.brand, pressedBg: semantic.brandPressed, fg: semantic.textOnBrand, border: semantic.brand },
  secondary: { bg: toneColors.primary.bg, pressedBg: colors.primary[100], fg: semantic.textBrand, border: toneColors.primary.border },
  // Nút trung tính nền trắng viền xám (đăng nhập Google/Apple...).
  outline: { bg: semantic.surface, pressedBg: colors.gray[50], fg: semantic.text, border: semantic.border },
  ghost: { bg: colors.transparent, pressedBg: colors.gray[100], fg: semantic.textSecondary, border: colors.transparent },
  // danger-700: ≥ 4.5:1 cả trên nền trắng và nền hồng nhạt khi hover/nhấn.
  danger: { bg: semantic.surface, pressedBg: toneColors.danger.bg, fg: colors.danger[700], border: toneColors.danger.border },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; icon: IconSize; text: 'smallMedium' | 'bodyMedium' }> = {
  sm: { height: sizes.control.sm, paddingHorizontal: spacing.ms, icon: 'sm', text: 'smallMedium' },
  md: { height: sizes.control.md, paddingHorizontal: spacing.md, icon: 'md', text: 'bodyMedium' },
  lg: { height: sizes.control.lg, paddingHorizontal: spacing.ml, icon: 'md', text: 'bodyMedium' },
};

export const Button = forwardRef<View, ButtonProps>(function Button({
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
}, ref) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;
  const { hovered, hoverProps } = useHover();

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={title}
      aria-disabled={!!isDisabled}
      aria-busy={loading}
      disabled={isDisabled}
      {...hoverProps}
      style={({ pressed }) => [
        styles.base,
        interactive,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          backgroundColor: pressed || (hovered && !isDisabled) ? v.pressedBg : v.bg,
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
          <Text variant={s.text} weight="semibold" color={v.fg}>
            {title}
          </Text>
          {rightIcon ? <Icon name={rightIcon} size={s.icon} color={v.fg} /> : null}
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: borderWidth.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: opacity.disabled },
});
