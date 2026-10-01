import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/layout';
import { Avatar, Button, Card, Icon, IconCircle, InfoRow, ScreenHeader, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { colors, type IconName, type Tone } from '@/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <Screen>
      <ScreenHeader title="Cá nhân" />

      <View style={{ width: '100%', maxWidth: 640, gap: 20 }}>
        <Card padding={20}>
          <View className="flex-row items-center gap-4">
            <Avatar name={user.fullName} size={64} />
            <View className="flex-1 gap-1">
              <Text variant="h2">{user.fullName}</Text>
              <Text variant="small" color={colors.gray[500]}>
                Mã khách hàng: {user.customerCode}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text variant="label" color={colors.gray[500]} style={{ marginBottom: 4 }}>
            Thông tin liên hệ
          </Text>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Số điện thoại" value={user.phone} />
          <InfoRow label="CCCD" value={user.idNumber} />
          <InfoRow label="Địa chỉ" value={user.address} last />
        </Card>

        <Card padding={8}>
          <MenuItem icon="notifications" tone="warning" label="Thông báo" onPress={() => router.push('/notifications')} />
          <MenuItem icon="receipt" tone="success" label="Phiếu thu của tôi" onPress={() => router.push('/receipts')} />
          <MenuItem icon="call" tone="info" label="Hotline hỗ trợ" value="1900 6868" />
        </Card>

        <Button title="Đăng xuất" variant="danger" leftIcon="log-out-outline" loading={signingOut} onPress={() => void handleSignOut()} />
        <Text variant="caption" color={colors.gray[400]} align="center">
          BeeSky · Phiên bản 1.0.0
        </Text>
      </View>
    </Screen>
  );
}

function MenuItem({ icon, tone, label, value, onPress }: { icon: IconName; tone: Tone; label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        borderRadius: 12,
        backgroundColor: pressed ? colors.gray[50] : 'transparent',
      })}>
      <IconCircle name={icon} tone={tone} size={36} />
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      {value ? (
        <Text variant="smallMedium" color={colors.gray[600]}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Icon name="chevron-forward" size={18} color={colors.gray[400]} /> : null}
    </Pressable>
  );
}
