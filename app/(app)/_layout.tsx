import { Tabs } from 'expo-router';

import { LinkCompanyDialog } from '@/components/domain';
import { AppNavigation } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { semantic } from '@/theme';

export default function AppLayout() {
  const { isWide } = useBreakpoint();
  const { activeCompanyId, activeCustomerId, newCompanies, linkNewCompanies, dismissNewCompanies } = useAuth();

  return (
    <>
      {/* Chuyển công ty / hồ sơ → dựng lại các màn để tải hợp đồng / thanh toán / phiếu thu của hồ sơ mới. */}
      <Tabs
        key={`${activeCompanyId ?? 'none'}:${activeCustomerId ?? ''}`}
        tabBar={(props) => <AppNavigation {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: isWide ? 'left' : 'bottom',
          sceneStyle: { backgroundColor: semantic.bg },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
        <Tabs.Screen name="contracts" options={{ title: 'Hợp đồng' }} />
        <Tabs.Screen name="noxh" options={{ title: 'Nhà ở xã hội' }} />
        <Tabs.Screen name="payments" options={{ title: 'Thanh toán' }} />
        {/* Phiếu thu mở từ thanh phân đoạn trong Thanh toán (không còn tab riêng). */}
        <Tabs.Screen name="receipts" options={{ title: 'Phiếu thu', href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Cá nhân' }} />
        <Tabs.Screen name="notifications" options={{ title: 'Thông báo', href: null }} />
        <Tabs.Screen name="contract/[id]" options={{ title: 'Hợp đồng', href: null }} />
        {/* Mã QR thanh toán — mở từ "Xác nhận thanh toán" ở Chi tiết hợp đồng. */}
        <Tabs.Screen name="pay" options={{ title: 'Thanh toán', href: null }} />
        <Tabs.Screen name="yeu-cau" options={{ title: 'Yêu cầu', href: null }} />
        <Tabs.Screen name="ban-giao" options={{ title: 'Bàn giao căn hộ', href: null }} />
        <Tabs.Screen name="lich-ban-giao" options={{ title: 'Lịch bàn giao', href: null }} />
        <Tabs.Screen name="tuy-chinh-trang-chu" options={{ title: 'Tuỳ chỉnh Trang chủ', href: null }} />
        {/* Nhắn tin với chủ đầu tư — mở từ nút tin nhắn ở Trang chủ / lưới chức năng. */}
        <Tabs.Screen name="tin-nhan" options={{ title: 'Nhắn tin', href: null }} />
      </Tabs>
      {/* Hồ sơ phát sinh ở công ty mới khi đang đăng nhập → nhập mật khẩu để liên kết. */}
      <LinkCompanyDialog companies={newCompanies} onLink={linkNewCompanies} onDismiss={dismissNewCompanies} />
    </>
  );
}
