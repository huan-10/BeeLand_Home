import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, layout } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Bật kéo-để-làm-mới khi truyền vào. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Mặc định có ScrollView; tắt khi màn hình tự quản lý cuộn. */
  scroll?: boolean;
}

/**
 * Khung nội dung chung: nền xám nhạt, tôn trọng safe area, và trên màn hình rộng
 * giới hạn nội dung tối đa 1100px, căn giữa.
 */
export function Screen({ children, onRefresh, refreshing = false, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const horizontal = isWide ? 32 : 16;

  const content = (
    <View style={[styles.container, { paddingHorizontal: horizontal, paddingTop: (isWide ? 32 : 12) + insets.top }]}>
      {children}
    </View>
  );

  if (!scroll) return <View style={styles.root}>{content}</View>;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} colors={[colors.primary[500]]} />
        ) : undefined
      }>
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  container: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', gap: 20 },
});
