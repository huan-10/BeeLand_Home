import { useId, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { colors, layout, radius, semantic, shadows, spacing, zIndex } from '@/theme';

import { IconButton } from './IconButton';
import { Text } from './Text';

export interface DialogProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Hàng nút ở cuối hộp thoại. */
  actions?: ReactNode;
}

/**
 * Hộp thoại modal: `role="dialog"` + `aria-modal`, tiêu đề làm nhãn.
 * Đóng bằng nút X, chạm vùng tối, Esc (web) hoặc nút Back (Android) — đều qua `onRequestClose`.
 * Web: focus bị giữ trong hộp thoại (focus trap của Modal). Tắt hiệu ứng khi giảm chuyển động.
 */
export function Dialog({ visible, title, onClose, children, actions }: DialogProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const isWeb = Platform.OS === 'web';
  // Web: Modal của react-native-web đã là phần tử role="dialog" aria-modal và nhận thêm thuộc tính;
  // gắn tiêu đề vào đó thay vì lồng thêm một dialog thứ hai.
  const webLabel: Record<string, string> = isWeb ? { 'aria-labelledby': titleId } : {};
  return (
    <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={onClose} {...webLabel}>
      <View style={styles.backdrop}>
        <View
          style={[styles.dialog, shadows.modal]}
          role={isWeb ? undefined : 'dialog'}
          aria-modal={isWeb ? undefined : true}
          aria-labelledby={isWeb ? undefined : titleId}>
          <View style={styles.header}>
            <Text variant="heading" nativeID={titleId} accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <IconButton icon="close" variant="plain" accessibilityLabel="Đóng" onPress={onClose} />
          </View>
          <View style={styles.body}>{children}</View>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
        {/* Vùng tối bấm để đóng: đặt sau hộp thoại trong cây (để focus đầu tiên rơi vào hộp thoại), xếp lớp phía dưới. */}
        <Pressable style={[StyleSheet.absoluteFill, styles.backdropHit]} onPress={onClose} accessibilityLabel="Đóng hộp thoại" tabIndex={-1} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md, backgroundColor: colors.overlay.scrim },
  backdropHit: { zIndex: zIndex.base },
  dialog: {
    zIndex: zIndex.overlay,
    width: '100%',
    maxWidth: layout.formMaxWidth,
    borderRadius: radius['3xl'],
    backgroundColor: semantic.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  title: { flex: 1 },
  body: { gap: spacing.ms },
  actions: { flexDirection: 'row', gap: spacing.ms, justifyContent: 'flex-end', flexWrap: 'wrap' },
});
