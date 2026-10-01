import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Animated, { FadeInUp, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { breakpoints, layout, motion, radius, semantic, shadows, sizes, spacing, zIndex, type IconName, type Tone } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type ToastTone = Extract<Tone, 'info' | 'success' | 'danger'>;

interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneIcon: Record<ToastTone, IconName> = {
  info: 'info',
  success: 'checkCircle',
  danger: 'alertCircle',
};

/** Icon trên nền tối: thông tin / thành công dùng màu sáng, lỗi dùng cam mật (≥ 3:1 trên ink). */
const toneAccent: Record<ToastTone, string> = {
  info: semantic.onInverseMuted,
  success: semantic.onInverseAccent,
  danger: semantic.onInverseAccent,
};

/** Thông báo ngắn ở cuối màn hình, tự ẩn sau `motion.toast` ms, không lấy focus (role="status"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const counter = useRef(0);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Màn hẹp: toast nằm trên thanh tab nổi để không bị che.
  const bottom = insets.bottom + spacing.lg + (width < breakpoints.md ? sizes.tabBar.height + spacing.ms : 0);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    counter.current += 1;
    setToast({ id: counter.current, message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), motion.toast);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={[styles.host, { bottom }]}>
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(motion.base).reduceMotion(ReduceMotion.System)}
            exiting={FadeOutDown.duration(motion.fast).reduceMotion(ReduceMotion.System)}
            style={[styles.toast, shadows.overlay]}
            role="status"
            accessibilityLiveRegion="polite">
            <Icon name={toneIcon[toast.tone]} color={toneAccent[toast.tone]} strong />
            <Text variant="captionStrong" color={semantic.onInverse} style={styles.text}>
              {toast.message}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải được dùng bên trong <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  host: { pointerEvents: 'box-none', position: 'absolute', left: layout.gutterMobile, right: layout.gutterMobile, alignItems: 'center', zIndex: zIndex.toast },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: sizes.toastMaxWidth,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: semantic.inverseStrong,
  },
  text: { flexShrink: 1 },
});
