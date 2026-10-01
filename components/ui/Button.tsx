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

import { BrandMark, type BrandName } from './BrandMark';
import { Icon } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  /** Logo dịch vụ bên thứ ba bên trái nhãn (đăng nhập Google / Apple). */
  brand?: BrandName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<ButtonVariant, { bg: string; hoverBg: string; pressedBg: string; fg: string; border: string }> = {
  // Nút chính: cam mật ong đậm, chữ trắng 5.4:1 (cam sáng primary-500 chỉ để trang trí).
  primary: { bg: semantic.action, hoverBg: semantic.actionHover, pressedBg: semantic.actionPressed, fg: semantic.textOnAction, border: semantic.action },
  secondary: { bg: toneColors.primary.bg, hoverBg: colors.primary[100], pressedBg: colors.primary[200], fg: semantic.textBrand, border: toneColors.primary.bg },
  // Nút trung tính nền trắng viền cát (đăng nhập Google/Apple, hành động phụ).
  outline: { bg: semantic.surface, hoverBg: semantic.surfaceSunken, pressedBg: semantic.border, fg: semantic.text, border: semantic.borderStrong },
  ghost: { bg: colors.transparent, hoverBg: semantic.surfaceSunken, pressedBg: semantic.border, fg: semantic.textSecondary, border: colors.transparent },
  // danger-700: ≥ 4.5:1 cả trên nền trắng và nền hồng nhạt khi hover/nhấn.
  danger: { bg: semantic.surface, hoverBg: toneColors.danger.bg, pressedBg: toneColors.danger.border, fg: toneColors.danger.fg, border: toneColors.danger.border },
  // Nền tối ink: hành động phụ đặt cạnh thẻ sáng hoặc trên thẻ tổng tiền.
  inverse: { bg: semantic.inverse, hoverBg: semantic.inverseHover, pressedBg: semantic.inverseStrong, fg: semantic.onInverse, border: semantic.inverse },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; icon: IconSize; text: 'captionStrong' | 'subhead' }> = {
  sm: { height: sizes.control.sm, paddingHorizontal: spacing.md, icon: 'sm', text: 'captionStrong' },
  md: { height: sizes.control.md, paddingHorizontal: spacing.ml, icon: 'md', text: 'subhead' },
  lg: { height: sizes.control.lg, paddingHorizontal: spacing.lg, icon: 'md', text: 'subhead' },
};

export const Button = forwardRef<View, ButtonProps>(function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  brand,
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
          backgroundColor: pressed ? v.pressedBg : hovered && !isDisabled ? v.hoverBg : v.bg,
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
          {brand ? <BrandMark name={brand} size={s.icon} color={v.fg} /> : null}
          {leftIcon ? <Icon name={leftIcon} size={s.icon} color={v.fg} /> : null}
          <Text variant={s.text} weight="semibold" color={v.fg} align="center">
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
    borderRadius: radius.lg,
    borderWidth: borderWidth.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: opacity.disabled },
});
