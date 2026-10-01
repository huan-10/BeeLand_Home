import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, motion, radius, semantic, shadows, sizes, spacing, toneColors, zIndex, type IconName, type Tone } from '@/theme';

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
  info: 'information-circle',
  success: 'checkmark-circle',
  danger: 'alert-circle',
};

/** Thông báo ngắn ở cuối màn hình, tự ẩn sau `motion.toast` ms, không lấy focus (role="status"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const counter = useRef(0);
  const insets = useSafeAreaInsets();

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
      <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + spacing.lg }]}>
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(motion.base).reduceMotion(ReduceMotion.System)}
            exiting={FadeOutDown.duration(motion.fast).reduceMotion(ReduceMotion.System)}
            style={[styles.toast, shadows.lg]}
            role="status"
            accessibilityLiveRegion="polite">
            <Icon name={toneIcon[toast.tone]} color={toneColors[toast.tone].solid} />
            <Text variant="smallMedium" color={semantic.textOnPrimary} style={styles.text}>
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
  host: { position: 'absolute', left: layout.gutterMobile, right: layout.gutterMobile, alignItems: 'center', zIndex: zIndex.toast },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: sizes.toastMaxWidth,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gray[900],
  },
  text: { flexShrink: 1 },
});
