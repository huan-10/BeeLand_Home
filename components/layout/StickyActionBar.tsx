import { useContext, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderWidth, layout, semantic, shadows, spacing } from '@/theme';

/**
 * Thanh hành động dính ở đáy màn hình (mobile). Đặt ngoài ScrollView để không che nội dung.
 * Nếu bottom tab đang hiển thị thì tab bar đã xử lý vùng an toàn; ngược lại tự chừa `insets.bottom`.
 */
export function StickyActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const bottom = tabBarHeight > 0 ? spacing.ms : Math.max(insets.bottom, spacing.ms);
  return (
    <View style={[styles.bar, shadows.navTop, { paddingBottom: bottom }]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: semantic.surface,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: semantic.borderSubtle,
    paddingTop: spacing.ms,
    paddingHorizontal: layout.gutterMobile,
  },
  inner: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
});
