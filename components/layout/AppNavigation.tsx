import type { BottomTabBarProps } from 'expo-router/tabs';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Icon, IconButton, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { floatingTabBarBottom } from '@/hooks/useFloatingTabBarSpace';
import { useHover } from '@/hooks/useHover';
import {
  borderWidth,
  interactive,
  layout,
  letterSpacing,
  radius,
  semantic,
  shadows,
  sizes,
  spacing,
  zIndex,
} from '@/theme';

import { Logo } from './Logo';
import { primaryNavItems, secondaryNavItems, type NavItem } from './navItems';

/**
 * Thanh điều hướng của ứng dụng, dùng làm `tabBar` cho `<Tabs>`.
 * Dưới 768px: thanh tab kính mờ nổi 5 mục. Từ 768px: sidebar trái có logo.
 */
export function AppNavigation({ state, navigation }: BottomTabBarProps) {
  const { isWide } = useBreakpoint();
  const activeName = state.routes[state.index]?.name;

  const onNavigate = (item: NavItem) => {
    const route = state.routes.find((r) => r.name === item.name);
    if (!route) return;
    const isFocused = activeName === item.name;
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

/**
 * Mobile: thanh tab kính mờ nổi (viên thuốc căn giữa, cách đáy một khoảng). Nội dung phía sau
 * được chừa chỗ bởi `useFloatingTabBarSpace` trong `Screen` / `StickyActionBar`.
 */
function BottomBar({ activeName, onNavigate }: BarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.floatWrap, { bottom: floatingTabBarBottom(insets.bottom) }]}>
      {/* Hai lớp: lớp ngoài giữ bóng, lớp trong cắt bo tròn cho hiệu ứng kính (iOS mất bóng khi overflow hidden). */}
      <View style={[styles.floatShadow, shadows.overlay]}>
        <View style={styles.floatBar}>
          <BlurView intensity={sizes.tabBar.blur} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
          <View style={styles.floatItems} role="tablist" aria-label="Điều hướng chính">
            {primaryNavItems.map((item) => (
              <BottomItem key={item.name} item={item} active={activeName === item.name} onPress={() => onNavigate(item)} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function BottomItem({ item, active, onPress }: { item: NavItem; active: boolean; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  const fg = active ? semantic.onInverse : semantic.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      aria-selected={active}
      accessibilityLabel={item.label}
      {...hoverProps}
      style={({ pressed }) => [
        styles.bottomItem,
        interactive,
        active && styles.bottomItemActive,
        (hovered || pressed) && (active ? styles.bottomItemActiveHover : styles.bottomItemHover),
      ]}>
      <Icon name={item.icon} color={fg} strong={active} />
      <Text variant="label" weight={active ? 'semibold' : 'medium'} color={fg} style={styles.bottomLabel}>
        {item.label}
      </Text>
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
      accessibilityLabel={item.label}
      aria-selected={active}
      style={({ pressed }) => [
        styles.sidebarItem,
        interactive,
        active && styles.sidebarItemActive,
        (pressed || hovered) && (active ? styles.sidebarItemActiveHover : styles.sidebarItemPressed),
      ]}>
      <Icon name={item.icon} color={active ? semantic.onInverse : semantic.icon} strong={active} />
      <Text variant="captionStrong" weight={active ? 'semibold' : 'medium'} color={active ? semantic.onInverse : semantic.textSecondary}>
        {item.label}
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
    paddingHorizontal: spacing.sm,
    pointerEvents: 'box-none',
  },
  floatShadow: { width: '100%', maxWidth: sizes.tabBar.maxWidth, borderRadius: radius.full },
  floatBar: {
    height: sizes.tabBar.height,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: borderWidth.hairline,
    borderColor: semantic.glassBorder,
  },
  glassTint: { backgroundColor: semantic.glass },
  floatItems: { flex: 1, flexDirection: 'row', padding: spacing.xs },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    minHeight: sizes.touchTarget,
  },
  bottomItemActive: { backgroundColor: semantic.inverse },
  bottomItemHover: { backgroundColor: semantic.surfaceSunken },
  bottomItemActiveHover: { backgroundColor: semantic.inverseHover },
  // Nhãn tab không giãn chữ để "Thanh toán" vừa một dòng ở 375px.
  bottomLabel: { letterSpacing: letterSpacing.normal },

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
    borderRadius: radius.lg,
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
    borderRadius: radius.md,
    backgroundColor: semantic.action,
  },
  // Ẩn khỏi màn hình nhưng vẫn nhận focus bằng bàn phím.
  skipHidden: { opacity: 0, transform: [{ translateY: -sizes.touchTarget * 2 }] },
});
