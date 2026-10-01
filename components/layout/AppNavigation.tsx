import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Icon, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, layout, radius } from '@/theme';

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
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {primaryNavItems.map((item) => {
        const active = activeName === item.name;
        return (
          <Pressable
            key={item.name}
            onPress={() => onNavigate(item)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={styles.bottomItem}>
            <View style={[styles.bottomIcon, active && styles.bottomIconActive]}>
              <Icon name={active ? item.activeIcon : item.icon} size={22} color={active ? colors.primary[600] : colors.gray[400]} />
            </View>
            <Text
              variant="caption"
              weight={active ? 'semibold' : 'medium'}
              color={active ? colors.primary[600] : colors.gray[500]}
              numberOfLines={1}
              style={styles.bottomLabel}>
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
    <View style={[styles.sidebar, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.sidebarLogo}>
        <Logo size={36} />
      </View>

      <View style={styles.sidebarNav} accessibilityRole="tablist">
        <Text variant="caption" weight="semibold" color={colors.gray[400]} style={styles.sidebarSection}>
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
          <Avatar name={user.fullName} size={36} />
          <View style={styles.userInfo}>
            <Text variant="smallMedium" numberOfLines={1}>
              {user.fullName}
            </Text>
            <Text variant="caption" color={colors.gray[500]} numberOfLines={1}>
              {user.customerCode}
            </Text>
          </View>
          <Pressable onPress={() => void signOut()} accessibilityRole="button" accessibilityLabel="Đăng xuất" hitSlop={8}>
            <Icon name="log-out-outline" size={20} color={colors.gray[500]} />
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
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.sidebarItem, active && styles.sidebarItemActive, pressed && !active && styles.sidebarItemPressed]}>
      <Icon name={active ? item.activeIcon : item.icon} size={20} color={active ? colors.primary[600] : colors.gray[500]} />
      <Text variant="smallMedium" weight={active ? 'semibold' : 'medium'} color={active ? colors.primary[700] : colors.gray[700]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 8,
    paddingHorizontal: 4,
    boxShadow: '0px -2px 12px rgba(16, 24, 40, 0.04)',
  },
  bottomItem: { flex: 1, alignItems: 'center', gap: 2 },
  bottomIcon: { width: 48, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  bottomIconActive: { backgroundColor: colors.primary[50] },
  bottomLabel: { fontSize: 11 },

  sidebar: {
    width: layout.sidebarWidth,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.gray[100],
    paddingHorizontal: 16,
  },
  sidebarLogo: { paddingHorizontal: 8, marginBottom: 32 },
  sidebarNav: { flex: 1, gap: 4 },
  sidebarSection: { paddingHorizontal: 12, marginBottom: 4, letterSpacing: 0.8 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.md,
  },
  sidebarItemActive: { backgroundColor: colors.primary[50] },
  sidebarItemPressed: { backgroundColor: colors.gray[50] },
  sidebarDivider: { height: 1, backgroundColor: colors.gray[100], marginVertical: 12, marginHorizontal: 12 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.gray[50],
  },
  userInfo: { flex: 1 },
});
