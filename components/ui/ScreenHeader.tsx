import { useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { interactive, radius, semantic, shadows, sizes, spacing } from '@/theme';

import { useHover } from '@/hooks/useHover';

import { Icon } from './Icon';
import { Pressable } from './Pressable';
import { Text } from './Text';
import { ScreenHeaderSlot } from './screenHeaderSlot';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Hiển thị nút quay lại khi có. */
  onBack?: () => void;
  right?: ReactNode;
}

/**
 * Tiêu đề màn. Có `onBack` và đang nằm trong `Screen` (mobile) → đăng ký để `Screen` ghim cố định ở đầu màn
 * (nút quay lại luôn trong tầm tay khi cuộn), không vẽ trong nội dung cuộn. Không có slot → vẽ tại chỗ như cũ.
 */
export function ScreenHeader(props: ScreenHeaderProps) {
  const { title, subtitle, onBack } = props;
  const pin = useContext(ScreenHeaderSlot);
  const pinned = !!pin && !!onBack;
  // Hàm quay lại đổi danh tính mỗi lần render → giữ trong ref, chỉ đăng ký lại khi chữ đổi.
  const backRef = useRef(onBack);
  useLayoutEffect(() => {
    backRef.current = onBack;
  });
  useLayoutEffect(() => {
    if (!pin || !pinned) return;
    pin({ title, subtitle, onBack: () => backRef.current?.() });
    return () => pin(null);
  }, [pin, pinned, title, subtitle]);
  if (pinned) return null;
  return <ScreenHeaderView {...props} />;
}

/** Phần vẽ của tiêu đề (tại chỗ, hoặc `compact` trong thanh ghim của `Screen`: tiêu đề / phụ đề một dòng). */
export function ScreenHeaderView({ title, subtitle, onBack, right, compact }: ScreenHeaderProps & { compact?: boolean }) {
  const { hovered, hoverProps } = useHover();
  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          {...hoverProps}
          style={({ pressed }) => [styles.back, interactive, (pressed || hovered) && styles.backPressed]}>
          <Icon name="chevronLeft" size="lg" color={semantic.text} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <Text variant="title" accessibilityRole="header" numberOfLines={compact ? 1 : undefined}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={semantic.textMuted} numberOfLines={compact ? 1 : undefined}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, paddingVertical: spacing.sm },
  back: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.full,
    backgroundColor: semantic.surface,
    ...shadows.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { backgroundColor: semantic.surfaceSunken },
  titles: { flex: 1, gap: spacing.xs },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
