import { useState, type ReactNode, type Ref } from 'react';
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type MouseEvent,
  type PressableProps as RNPressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';

export interface PressableState {
  pressed: boolean;
  hovered: boolean;
}

export interface PressableProps extends Omit<RNPressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle> | ((state: PressableState) => StyleProp<ViewStyle>);
  children?: ReactNode | ((state: PressableState) => ReactNode);
  ref?: Ref<View>;
}

/**
 * Thay cho `Pressable` của React Native ở mọi nơi trong app.
 *
 * NativeWind (react-native-css-interop) bọc `Pressable` và làm phẳng prop `style` thành object,
 * nên `style={({ pressed }) => …}` bị bỏ qua trên iOS/Android (mất nền, bóng, viên tab đang chọn).
 * Component này tự theo dõi trạng thái nhấn/hover rồi truyền xuống style tĩnh (children dạng hàm nhận cả `hovered`).
 */
export function Pressable({ style, children, onPressIn, onPressOut, onHoverIn, onHoverOut, ...rest }: PressableProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const state = { pressed, hovered };
  const resolved = typeof style === 'function' ? style(state) : style;

  return (
    <RNPressable
      {...rest}
      style={resolved}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      onHoverIn={(e: MouseEvent) => {
        setHovered(true);
        onHoverIn?.(e);
      }}
      onHoverOut={(e: MouseEvent) => {
        setHovered(false);
        onHoverOut?.(e);
      }}>
      {typeof children === 'function' ? children(state) : children}
    </RNPressable>
  );
}
