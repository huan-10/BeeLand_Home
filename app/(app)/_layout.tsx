import { Tabs } from 'expo-router';

import { AppNavigation } from '@/components/layout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { semantic } from '@/theme';

export default function AppLayout() {
  const { isWide } = useBreakpoint();

  return (
    <Tabs
      tabBar={(props) => <AppNavigation {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isWide ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: semantic.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="contracts" options={{ title: 'Hợp đồng' }} />
      <Tabs.Screen name="payments" options={{ title: 'Thanh toán' }} />
      <Tabs.Screen name="receipts" options={{ title: 'Phiếu thu' }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', href: null }} />
      <Tabs.Screen name="contract/[id]" options={{ title: 'Hợp đồng', href: null }} />
    </Tabs>
  );
}
