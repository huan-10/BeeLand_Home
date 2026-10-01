import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout';
import { Avatar, Button, Card, Icon, IconCircle, InfoRow, ScreenHeader, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { colors, interactive, layout, radius, semantic, spacing, type IconName, type Tone } from '@/theme';

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

      <View style={styles.column}>
        <Card padding="ml">
          <View className="flex-row items-center gap-md">
            <Avatar name={user.fullName} size="lg" />
            <View className="flex-1 gap-xs">
              <Text variant="h2">{user.fullName}</Text>
              <Text variant="small" color={semantic.textMuted}>
                Mã khách hàng: {user.customerCode}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text variant="label" color={semantic.textMuted} style={styles.cardTitle}>
            Thông tin liên hệ
          </Text>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Số điện thoại" value={user.phone} />
          <InfoRow label="CCCD" value={user.idNumber} />
          <InfoRow label="Địa chỉ" value={user.address} last />
        </Card>

        <Card padding="sm">
          <MenuItem icon="notifications" tone="warning" label="Thông báo" onPress={() => router.push('/notifications')} />
          <MenuItem icon="receipt" tone="success" label="Phiếu thu của tôi" onPress={() => router.push('/receipts')} />
          <MenuItem icon="call" tone="info" label="Hotline hỗ trợ" value="1900 6868" />
        </Card>

        {/* Hành động nguy hiểm tách riêng khỏi danh sách menu. */}
        <Button title="Đăng xuất" variant="danger" leftIcon="log-out-outline" loading={signingOut} onPress={() => void handleSignOut()} />
        <Text variant="caption" color={semantic.textMuted} align="center">
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
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={({ pressed }) => [styles.menuItem, onPress ? interactive : null, pressed && styles.menuPressed]}>
      <IconCircle name={icon} tone={tone} size="sm" />
      <Text variant="bodyMedium" style={styles.flex}>
        {label}
      </Text>
      {value ? (
        <Text variant="smallMedium" color={semantic.textSecondary}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Icon name="chevron-forward" size="sm" color={semantic.iconMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: layout.profileMaxWidth, gap: spacing.ml },
  cardTitle: { marginBottom: spacing.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  menuPressed: { backgroundColor: colors.gray[50] },
  flex: { flex: 1 },
});
