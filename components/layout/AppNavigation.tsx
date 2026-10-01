import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Icon, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  borderWidth,
  colors,
  hitSlop,
  interactive,
  layout,
  letterSpacing,
  radius,
  semantic,
  shadows,
  sizes,
  spacing,
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
      {primaryNavItems.map((item) => {
        const active = activeName === item.name;
        return (
          <Pressable
            key={item.name}
            onPress={() => onNavigate(item)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={[styles.bottomItem, interactive]}>
            <View style={[styles.bottomIcon, active && styles.bottomIconActive]}>
              <Icon name={active ? item.activeIcon : item.icon} size="lg" color={active ? colors.primary[600] : semantic.iconMuted} />
            </View>
            <Text
              variant="caption"
              weight={active ? 'semibold' : 'medium'}
              color={active ? semantic.textBrand : semantic.textMuted}
              numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Sidebar({ activeName, onNavigate }: BarProps) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sidebar, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.md }]}>
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
            <Text variant="smallMedium" numberOfLines={1}>
              {user.fullName}
            </Text>
            <Text variant="caption" color={semantic.textMuted} numberOfLines={1}>
              {user.customerCode}
            </Text>
          </View>
          {/* Đăng xuất tách khỏi menu điều hướng (destructive-nav-separation). */}
          <Pressable
            onPress={() => void signOut()}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất"
            hitSlop={hitSlop}
            style={interactive}>
            <Icon name="log-out-outline" color={semantic.textMuted} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function SidebarItem({ item, active, onPress }: { item: NavItem; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.sidebarItem, interactive, active && styles.sidebarItemActive, pressed && !active && styles.sidebarItemPressed]}>
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
  bottomItem: { flex: 1, alignItems: 'center', gap: spacing['2xs'], minHeight: sizes.touchTarget },
  bottomIcon: {
    width: sizes.tabIndicator.width,
    height: sizes.tabIndicator.height,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIconActive: { backgroundColor: colors.primary[50] },

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
  sidebarDivider: { height: borderWidth.hairline, backgroundColor: semantic.borderSubtle, marginVertical: spacing.ms, marginHorizontal: spacing.ms },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.ms,
    borderRadius: radius.lg,
    backgroundColor: semantic.surfaceMuted,
  },
  userInfo: { flex: 1 },
});
