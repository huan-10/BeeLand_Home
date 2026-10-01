import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useFloatingTabBarSpace } from '@/hooks/useFloatingTabBarSpace';
import { layout, semantic, spacing } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Bật kéo-để-làm-mới khi truyền vào. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Mặc định có ScrollView; tắt khi màn hình tự quản lý cuộn (nội dung chiếm hết chiều cao). */
  scroll?: boolean;
  /** Vùng cố định dưới nội dung cuộn (ví dụ `StickyActionBar`) — không che nội dung. */
  footer?: ReactNode;
}

/**
 * Khung nội dung chung: nền xám sáng, tôn trọng safe area; trên màn hình rộng
 * nội dung tối đa 1100px, căn giữa.
 */
export function Screen({ children, onRefresh, refreshing = false, scroll = true, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  // Thanh tab nổi (mobile) phủ lên đáy màn hình: chừa chỗ để nội dung cuối không bị che.
  // Khi có `footer` (StickyActionBar), thanh đó tự chừa chỗ nên nội dung cuộn không cần thêm.
  const floatingSpace = useFloatingTabBarSpace();
  const tabBarSpace = footer ? 0 : floatingSpace;

  const content = (
    // role="main": đích của liên kết "Bỏ qua tới nội dung chính" (web).
    <View
      role="main"
      style={[
        styles.container,
        !scroll && styles.fill,
        !scroll && { paddingBottom: spacing.lg + tabBarSpace },
        {
          paddingHorizontal: isWide ? layout.gutterWide : layout.gutterMobile,
          paddingTop: (isWide ? spacing.xl : spacing.ms) + insets.top,
        },
      ]}>
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={styles.root}>
        {content}
        {footer}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + tabBarSpace }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={semantic.brand} colors={[semantic.brand]} />
        ) : undefined
      }>
      {content}
    </ScrollView>
    {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.bg },
  flex: { flex: 1 },
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', gap: spacing.ml },
});
