import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { layout, spacing } from '@/theme';

export interface ChipBarProps {
  children: ReactNode;
  accessibilityLabel?: string;
}

/**
 * Hàng chip lọc MỘT dòng, vuốt ngang — dùng trong thanh bám dính để thanh luôn gọn
 * (ngoài thanh bám dính vẫn dùng `chipRow` xuống dòng). Tràn sát mép màn hình như app hiện đại.
 */
export function ChipBar({ children, accessibilityLabel }: ChipBarProps) {
  const { isWide } = useBreakpoint();
  const gutter = isWide ? layout.gutterWide : layout.gutterMobile;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{ marginHorizontal: -gutter }}
      contentContainerStyle={[styles.row, { paddingHorizontal: gutter }]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Đệm dọc để bóng của chip không bị cắt.
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
});
