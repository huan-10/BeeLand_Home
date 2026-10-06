import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeaderView } from '@/components/ui/ScreenHeader';
import { ScreenHeaderSlot, type PinnedHeader } from '@/components/ui/screenHeaderSlot';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useFloatingTabBarSpace } from '@/hooks/useFloatingTabBarSpace';
import { layout, semantic, spacing, zIndex } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Bật kéo-để-làm-mới khi truyền vào. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Mặc định có ScrollView; tắt khi màn hình tự quản lý cuộn (nội dung chiếm hết chiều cao). */
  scroll?: boolean;
  /** Vùng cố định dưới nội dung cuộn (ví dụ `StickyActionBar`) — không che nội dung. */
  footer?: ReactNode;
  /**
   * Màn danh sách: phần đầu cuộn đi bình thường (tiêu đề, thẻ tổng quan lớn) — đặt TRƯỚC thanh bám dính.
   * Chỉ dùng cùng `sticky`.
   */
  top?: ReactNode;
  /**
   * Thanh bám dính đầu màn khi cuộn (bộ lọc, tab, tổng quan gọn).
   * `collapsed = true` khi phần `top` đã cuộn khỏi màn hình → hiện thêm dòng tổng quan gọn.
   */
  sticky?: (collapsed: boolean) => ReactNode;
  /** Ref tới ScrollView bên trong (cuộn tới một khối, ví dụ "Xem đợt đang mở"). */
  scrollRef?: RefObject<ScrollView | null>;
}

/**
 * Khung nội dung chung: nền sáng, tôn trọng safe area (thanh trạng thái có nền riêng để thanh bám dính
 * không nằm dưới tai thỏ); trên màn hình rộng nội dung tối đa 1100px, căn giữa.
 */
export function Screen({ children, onRefresh, refreshing = false, scroll = true, footer, top, sticky, scrollRef }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  // Thanh tab nổi (mobile) phủ lên đáy màn hình: chừa chỗ để nội dung cuối không bị che.
  // Khi có `footer` (StickyActionBar), thanh đó tự chừa chỗ nên nội dung cuộn không cần thêm.
  const floatingSpace = useFloatingTabBarSpace();
  const tabBarSpace = footer ? 0 : floatingSpace;
  const gutter = isWide ? layout.gutterWide : layout.gutterMobile;
  const padTop = isWide ? spacing.xl : spacing.ms;

  const [topHeight, setTopHeight] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: `ScreenHeader` có nút quay lại đăng ký vào đây → ghim cố định trên vùng cuộn (desktop giữ tại chỗ).
  const [pinned, setPinned] = useState<PinnedHeader | null>(null);
  const contentTop = pinned ? spacing.xs : padTop;
  const onTopLayout = useCallback((e: LayoutChangeEvent) => setTopHeight(e.nativeEvent.layout.height), []);
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Chỉ đổi state khi vượt ngưỡng → không render lại mỗi khung hình.
      const y = e.nativeEvent.contentOffset.y;
      const next = topHeight > 0 && y >= topHeight - spacing.sm;
      setCollapsed((prev) => (prev === next ? prev : next));
    },
    [topHeight],
  );

  const inner = (node: ReactNode, extra?: object) => (
    <View style={[styles.container, { paddingHorizontal: gutter }, extra]}>{node}</View>
  );

  const bar = pinned ? (
    <View style={styles.pinned}>{inner(<ScreenHeaderView title={pinned.title} subtitle={pinned.subtitle} onBack={pinned.onBack} compact />, styles.pinnedInner)}</View>
  ) : null;
  const provide = (node: ReactNode) => <ScreenHeaderSlot.Provider value={isWide ? null : setPinned}>{node}</ScreenHeaderSlot.Provider>;

  if (!scroll) {
    return provide(
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {bar}
        {/* role="main": đích của liên kết "Bỏ qua tới nội dung chính" (web). */}
        <View role="main" style={[styles.container, styles.fill, { paddingHorizontal: gutter, paddingTop: contentTop, paddingBottom: spacing.lg + tabBarSpace }]}>
          {children}
        </View>
        {footer}
      </View>,
    );
  }

  const refreshControl = onRefresh ? (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={semantic.brand} colors={[semantic.brand]} />
  ) : undefined;

  return provide(
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {bar}
      {sticky ? (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + tabBarSpace }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={[1]}
          onScroll={onScroll}
          scrollEventThrottle={32}
          refreshControl={refreshControl}>
          <View onLayout={onTopLayout}>{inner(top, { paddingTop: contentTop, gap: spacing.ml })}</View>
          {/* Thanh bám dính: nền màn hình che nội dung cuộn phía dưới (không đổ bóng — kiểu soft). */}
          <View style={styles.sticky}>{inner(sticky(collapsed), styles.stickyInner)}</View>
          <View role="main">{inner(children, { gap: spacing.ml, paddingTop: spacing.sm })}</View>
        </ScrollView>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl + tabBarSpace }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}>
          <View role="main">{inner(children, { paddingTop: contentTop, gap: spacing.ml })}</View>
        </ScrollView>
      )}
      {footer}
    </View>,
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.bg },
  flex: { flex: 1 },
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  sticky: { backgroundColor: semantic.bg },
  stickyInner: { paddingVertical: spacing.sm, gap: spacing.sm },
  // Thanh tiêu đề ghim / thanh bám dính: nền màn hình, không viền / bóng (kiểu AppHeader "soft" của beeland-app_2026).
  pinned: { backgroundColor: semantic.bg, zIndex: zIndex.sticky },
  pinnedInner: { paddingTop: spacing.xs },
});
