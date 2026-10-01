import type { BottomTabBarProps } from 'expo-router/tabs';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Icon, IconButton, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useHover } from '@/hooks/useHover';
import {
  borderWidth,
  colors,
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
 * Dưới 768px: bottom tab 5 mục. Từ 768px: sidebar trái có logo.
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

function BottomBar({ activeName, onNavigate }: BarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomBar, shadows.navTop, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]} accessibilityRole="tablist">
      {primaryNavItems.map((item) => (
        <BottomItem key={item.name} item={item} active={activeName === item.name} onPress={() => onNavigate(item)} />
      ))}
    </View>
  );
}

function BottomItem({ item, active, onPress }: { item: NavItem; active: boolean; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      aria-selected={active}
      accessibilityLabel={item.label}
      {...hoverProps}
      style={[styles.bottomItem, interactive]}>
      <View style={[styles.bottomIcon, active && styles.bottomIconActive, hovered && (active ? styles.bottomIconActiveHover : styles.bottomIconActive)]}>
        <Icon name={active ? item.activeIcon : item.icon} size="lg" color={active ? colors.primary[600] : semantic.iconMuted} />
      </View>
      <Text
        variant="caption"
        weight={active ? 'semibold' : 'medium'}
        color={active ? semantic.textBrand : semantic.textMuted}>
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
        <Text variant="overline" color={semantic.textMuted} style={styles.sidebarSection}>
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
            <Text variant="smallMedium">
              {user.fullName}
            </Text>
            <Text variant="caption" color={semantic.textMuted}>
              {user.customerCode}
            </Text>
          </View>
          {/* Đăng xuất tách khỏi menu điều hướng (destructive-nav-separation). */}
          <IconButton icon="log-out-outline" accessibilityLabel="Đăng xuất" onPress={() => void signOut()} />
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
      <Text variant="smallMedium" weight="semibold" color={semantic.textOnBrand}>
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
      <Icon name={active ? item.activeIcon : item.icon} color={active ? colors.primary[600] : semantic.textMuted} />
      <Text variant="smallMedium" weight={active ? 'semibold' : 'medium'} color={active ? semantic.textBrand : semantic.textSecondary}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: semantic.surface,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: semantic.borderSubtle,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  bottomItem: { flex: 1, alignItems: 'center', gap: spacing.xs, minHeight: sizes.touchTarget },
  bottomIcon: {
    width: sizes.tabIndicator.width,
    height: sizes.tabIndicator.height,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIconActive: { backgroundColor: colors.primary[50] },
  bottomIconActiveHover: { backgroundColor: colors.primary[100] },

  sidebar: {
    width: layout.sidebarWidth,
    backgroundColor: semantic.surface,
    borderRightWidth: borderWidth.hairline,
    borderRightColor: semantic.borderSubtle,
    paddingHorizontal: spacing.md,
  },
  sidebarLogo: { paddingHorizontal: spacing.sm, marginBottom: spacing.xl },
  sidebarNav: { flex: 1, gap: spacing.xs },
  sidebarSection: { paddingHorizontal: spacing.ms, marginBottom: spacing.xs, letterSpacing: letterSpacing.wide },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingHorizontal: spacing.ms,
    minHeight: sizes.touchTarget,
    borderRadius: radius.md,
  },
  sidebarItemActive: { backgroundColor: colors.primary[50] },
  sidebarItemPressed: { backgroundColor: semantic.surfaceMuted },
  sidebarItemActiveHover: { backgroundColor: colors.primary[100] },
  sidebarDivider: { height: borderWidth.hairline, backgroundColor: semantic.borderSubtle, marginVertical: spacing.ms, marginHorizontal: spacing.ms },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.ms,
    borderRadius: radius.lg,
    backgroundColor: semantic.surfaceMuted,
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
    backgroundColor: semantic.brand,
  },
  // Ẩn khỏi màn hình nhưng vẫn nhận focus bằng bàn phím.
  skipHidden: { opacity: 0, transform: [{ translateY: -sizes.touchTarget * 2 }] },
});
