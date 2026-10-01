import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFloatingTabBarSpace } from '@/hooks/useFloatingTabBarSpace';
import { layout, radius, semantic, shadows, spacing } from '@/theme';

/**
 * Thanh hành động dính ở đáy màn hình (mobile). Đặt ngoài ScrollView để không che nội dung.
 * Khi thanh tab nổi đang hiển thị, nội dung của thanh này nằm ngay trên thanh tab;
 * ngược lại tự chừa vùng an toàn `insets.bottom`.
 */
export function StickyActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const tabBarSpace = useFloatingTabBarSpace();
  const bottom = tabBarSpace > 0 ? tabBarSpace : Math.max(insets.bottom, spacing.ms);
  return (
    <View style={[styles.bar, shadows.raisedTop, { paddingBottom: bottom }]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: semantic.surface,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingTop: spacing.md,
    paddingHorizontal: layout.gutterMobile,
  },
  inner: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
});
