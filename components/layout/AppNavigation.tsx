import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Icon, IconButton, Pressable, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { floatingTabBarBottom } from '@/hooks/useFloatingTabBarSpace';
import { useHover } from '@/hooks/useHover';
import {
  borderWidth,
  interactive,
  layout,
  opacity,
  radius,
  semantic,
  shadows,
  sizes,
  spacing,
  zIndex,
} from '@/theme';

import { Logo } from './Logo';
import { activeNavName, primaryNavItems, secondaryNavItems, type NavItem } from './navItems';

/**
 * Thanh điều hướng của ứng dụng, dùng làm `tabBar` cho `<Tabs>`.
 * Dưới 768px: thanh tab kính mờ nổi 5 mục. Từ 768px: sidebar trái có logo.
 */
export function AppNavigation({ state, navigation }: BottomTabBarProps) {
  const { isWide } = useBreakpoint();
  const routeName = state.routes[state.index]?.name;
  // Route con (Phiếu thu) tô sáng tab chính tương ứng (Thanh toán).
  const activeName = activeNavName(routeName);

  const onNavigate = (item: NavItem) => {
    const route = state.routes.find((r) => r.name === item.name);
    if (!route) return;
    const isFocused = routeName === item.name;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) return;
    if (isFocused) {
      // Bấm lại tab đang mở: quay về màn hình đầu của tab đó.
      navigation.navigate(route.name, { screen: 'index' });
    } else {
      navigation.navigate(route.name);
    }
  };

  return isWide ? (
    <Sidebar activeName={activeName} onNavigate={onNavigate} />
  ) : (
    <BottomBar activeName={activeName} onNavigate={onNavigate} />
  );
}

interface BarProps {
  activeName: string | undefined;
  onNavigate: (item: NavItem) => void;
}

const TAB_SLOT = sizes.tabBar.slot;
const TAB_PAD = sizes.tabBar.pad;
const PILL_H = sizes.tabBar.height - TAB_PAD * 2;
const PILL_W = TAB_SLOT - TAB_PAD;
const pillOffset = (i: number) => TAB_SLOT * i + (TAB_SLOT - PILL_W) / 2;

/**
 * Mobile: thanh tab kính mờ nổi kiểu Beeland Sales — viên thuốc gọn căn giữa, chỉ icon; tab đang chọn
 * nằm trong viên kính sáng (icon xanh) trượt giữa các tab. Nhãn vẫn đọc được qua `accessibilityLabel`.
 * Nội dung phía sau được chừa chỗ bởi `useFloatingTabBarSpace` trong `Screen` / `StickyActionBar`.
 */
function BottomBar({ activeName, onNavigate }: BarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = Math.max(0, primaryNavItems.findIndex((item) => item.name === activeName));
  // Khởi tạo đúng vị trí tab hiện tại → lần đầu không trượt từ mép trái.
  const [x] = useState(() => new Animated.Value(pillOffset(activeIndex)));

  useEffect(() => {
    Animated.spring(x, { toValue: pillOffset(activeIndex), useNativeDriver: Platform.OS !== 'web', speed: 18, bounciness: 6 }).start();
  }, [activeIndex, x]);

  return (
    <View style={[styles.floatWrap, { bottom: floatingTabBarBottom(insets.bottom) }]}>
      {/* Hai lớp: lớp ngoài giữ bóng, lớp trong cắt bo tròn cho hiệu ứng kính (iOS mất bóng khi overflow hidden). */}
      <View style={[styles.floatShadow, shadows.overlay]}>
        <View style={styles.floatBar} role="tablist" aria-label="Điều hướng chính">
          <BlurView intensity={sizes.tabBar.blur} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
          <Animated.View style={[styles.pill, { transform: [{ translateX: x }] }]} />
          {primaryNavItems.map((item) => (
            <BottomItem key={item.name} item={item} active={activeName === item.name} onPress={() => onNavigate(item)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function BottomItem({ item, active, onPress }: { item: NavItem; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      aria-selected={active}
      accessibilityLabel={item.label}
      style={({ pressed, hovered }) => [styles.bottomItem, interactive, (pressed || hovered) && !active && styles.bottomItemPressed]}>
      <Icon name={item.icon} color={active ? semantic.action : semantic.inverse} variant={active ? 'fill' : 'line'} />
    </Pressable>
  );
}

function Sidebar({ activeName, onNavigate }: BarProps) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sidebar, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.md }]}>
      {Platform.OS === 'web' ? <SkipLink /> : null}
      <View style={styles.sidebarLogo}>
        <Logo size="md" />
      </View>

      <View style={styles.sidebarNav} accessibilityRole="tablist">
        <Text variant="label" color={semantic.textMuted} style={styles.sidebarSection}>
          MENU
        </Text>
        {primaryNavItems.map((item) => (
          <SidebarItem key={item.name} item={item} active={activeName === item.name} onPress={() => onNavigate(item)} />
        ))}
        <View style={styles.sidebarDivider} />
        {secondaryNavItems.map((item) => (
          <SidebarItem key={item.name} item={item} active={activeName === item.name} onPress={() => onNavigate(item)} />
        ))}
      </View>

      {user ? (
        <View style={styles.userCard}>
          <Avatar name={user.fullName} size="sm" />
          <View style={styles.userInfo}>
            <Text variant="captionStrong" weight="semibold">
              {user.fullName}
            </Text>
            <Text variant="label" weight="medium" color={semantic.textMuted}>
              {user.customerCode}
            </Text>
          </View>
          {/* Đăng xuất tách khỏi menu điều hướng (destructive-nav-separation). */}
          <IconButton icon="logout" variant="plain" accessibilityLabel="Đăng xuất" onPress={() => void signOut()} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * "Bỏ qua tới nội dung chính" (web): phần tử focus đầu tiên của trang, chỉ hiện khi được focus,
 * chuyển focus tới vùng `role="main"` đang hiển thị (skill: skip-links).
 */
function SkipLink() {
  const [focused, setFocused] = useState(false);
  const skip = () => {
    const main = [...document.querySelectorAll<HTMLElement>('[role="main"]')].find((el) => el.offsetParent !== null);
    if (!main) return;
    main.setAttribute('tabindex', '-1');
    main.focus();
  };
  return (
    <Pressable
      onPress={skip}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="link"
      style={[styles.skipLink, interactive, !focused && styles.skipHidden]}>
      <Text variant="captionStrong" weight="semibold" color={semantic.textOnAction}>
        Bỏ qua tới nội dung chính
      </Text>
    </Pressable>
  );
}

function SidebarItem({ item, active, onPress }: { item: NavItem; active: boolean; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={item.sidebarLabel ?? item.label}
      aria-selected={active}
      style={({ pressed }) => [
        styles.sidebarItem,
        interactive,
        active && styles.sidebarItemActive,
        (pressed || hovered) && (active ? styles.sidebarItemActiveHover : styles.sidebarItemPressed),
      ]}>
      <Icon name={item.icon} color={active ? semantic.onInverse : semantic.icon} variant={active ? 'fill' : 'line'} />
      <Text variant="captionStrong" weight={active ? 'semibold' : 'medium'} color={active ? semantic.onInverse : semantic.textSecondary}>
        {item.sidebarLabel ?? item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  floatShadow: { borderRadius: radius.full },
  floatBar: {
    height: sizes.tabBar.height,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TAB_PAD,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: borderWidth.hairline,
    borderColor: semantic.glassBorder,
  },
  glassTint: { backgroundColor: semantic.glass },
  pill: {
    position: 'absolute',
    left: TAB_PAD,
    top: TAB_PAD - borderWidth.hairline,
    width: PILL_W,
    height: PILL_H,
    borderRadius: radius.full,
    backgroundColor: semantic.glassActive,
  },
  bottomItem: { width: TAB_SLOT, height: PILL_H, alignItems: 'center', justifyContent: 'center' },
  bottomItemPressed: { opacity: opacity.pressed },

  sidebar: {
    width: layout.sidebarWidth,
    backgroundColor: semantic.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: semantic.border,
    paddingHorizontal: spacing.md,
  },
  sidebarLogo: { paddingHorizontal: spacing.sm, marginBottom: spacing.xl },
  sidebarNav: { flex: 1, gap: spacing.xs },
  sidebarSection: { paddingHorizontal: spacing.ms, marginBottom: spacing.xs },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingHorizontal: spacing.ms,
    minHeight: sizes.control.md,
    borderRadius: radius.xl,
  },
  sidebarItemActive: { backgroundColor: semantic.inverse },
  sidebarItemPressed: { backgroundColor: semantic.surfaceSunken },
  sidebarItemActiveHover: { backgroundColor: semantic.inverseHover },
  sidebarDivider: { height: StyleSheet.hairlineWidth, backgroundColor: semantic.border, marginVertical: spacing.ms, marginHorizontal: spacing.ms },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.ms,
    borderRadius: radius.xl,
    backgroundColor: semantic.surfaceSunken,
  },
  userInfo: { flex: 1, minWidth: 0 },
  skipLink: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: zIndex.toast,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: semantic.action,
  },
  // Ẩn khỏi màn hình nhưng vẫn nhận focus bằng bàn phím.
  skipHidden: { opacity: 0, transform: [{ translateY: -sizes.touchTarget * 2 }] },
});
