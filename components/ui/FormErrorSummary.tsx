import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View, findNodeHandle } from 'react-native';

import { borderWidth, colors, interactive, radius, sizes, spacing, toneColors } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface FormErrorItem {
  field: string;
  message: string;
}

export interface FormErrorSummaryProps {
  title?: string;
  errors: FormErrorItem[];
  /** Bấm vào một lỗi → chuyển focus tới ô tương ứng. */
  onSelect: (field: string) => void;
}

export interface FormErrorSummaryHandle {
  focus: () => void;
}

/**
 * Tóm tắt lỗi đầu form (skill: focusable error summary). Nhận focus sau khi gửi form thất bại,
 * mỗi lỗi liên kết tới ô nhập; lỗi chi tiết vẫn hiển thị dưới từng ô.
 */
export const FormErrorSummary = forwardRef<FormErrorSummaryHandle, FormErrorSummaryProps>(function FormErrorSummary(
  { title = 'Vui lòng kiểm tra lại thông tin', errors, onSelect },
  ref,
) {
  const containerRef = useRef<View>(null);

  const focus = () => {
    const node = containerRef.current;
    if (!node) return;
    if (Platform.OS === 'web') {
      (node as unknown as { focus?: () => void }).focus?.();
      return;
    }
    const handle = findNodeHandle(node);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  };

  useImperativeHandle(ref, () => ({ focus }));

  useEffect(() => {
    if (errors.length > 0) AccessibilityInfo.announceForAccessibility?.(`${title}. ${errors.map((e) => e.message).join('. ')}`);
  }, [errors, title]);

  if (errors.length === 0) return null;

  return (
    <View ref={containerRef} style={styles.box} role="alert" tabIndex={-1} accessible={Platform.OS !== 'web'}>
      <View style={styles.header}>
        <Icon name="alertCircle" color={toneColors.danger.fg} />
        <Text variant="captionStrong" weight="semibold" color={toneColors.danger.fg} style={styles.flex}>
          {title}
        </Text>
      </View>
      {errors.map((e) => (
        <Pressable
          key={e.field}
          onPress={() => onSelect(e.field)}
          accessibilityRole="link"
          accessibilityLabel={`${e.message}. Chuyển tới ô nhập`}
          style={[styles.item, interactive]}>
          <Text variant="caption" color={colors.danger[700]} style={styles.underline}>
            {e.message}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    gap: spacing.xs,
    padding: spacing.ms,
    borderRadius: radius.lg,
    backgroundColor: toneColors.danger.bg,
    borderWidth: borderWidth.hairline,
    borderColor: toneColors.danger.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  item: { paddingLeft: spacing.xl - spacing.xs, minHeight: sizes.touchTarget, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
