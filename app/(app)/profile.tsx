import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ChangePasswordDialog } from '@/components/domain';
import { Screen } from '@/components/layout';
import { Avatar, Button, Card, Dialog, Icon, IconCircle, KeyValueRow, ScreenHeader, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useHover } from '@/hooks/useHover';
import { appVersionLabel } from '@/lib/appInfo';
import { interactive, layout, radius, semantic, shadows, sizes, spacing, type IconName, type Tone } from '@/theme';

const HOTLINE = '1900 6868';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <Screen>
      <ScreenHeader title="Cá nhân" subtitle="Thông tin tài khoản và cài đặt" />

      <View style={styles.column}>
        {/* Thẻ tài khoản nền ink — cùng ngôn ngữ với thẻ tổng tiền. */}
        <View style={styles.accountCard}>
          <Avatar name={user.fullName} size="lg" />
          <View style={styles.flex}>
            <Text variant="title" color={semantic.onInverse}>
              {user.fullName}
            </Text>
            <Text variant="caption" color={semantic.onInverseMuted}>
              Mã khách hàng: {user.customerCode}
            </Text>
          </View>
        </View>

        <Card>
          <Text variant="label" color={semantic.textMuted} accessibilityRole="header" style={styles.cardTitle}>
            Thông tin tài khoản
          </Text>
          <KeyValueRow label="Mã khách hàng" value={user.customerCode} copyable numeric />
          <KeyValueRow label="Email" value={user.email} copyable />
          <KeyValueRow label="Số điện thoại" value={user.phone} copyable numeric />
          <KeyValueRow label="CCCD" value={user.idNumber || '—'} />
          <KeyValueRow label="Địa chỉ" value={user.address || '—'} last />
        </Card>

        <Card padding="sm">
          <Text variant="label" color={semantic.textMuted} accessibilityRole="header" style={styles.menuTitle}>
            Bảo mật & hỗ trợ
          </Text>
          <MenuItem icon="key" tone="primary" label="Đổi mật khẩu" onPress={() => setPasswordOpen(true)} />
          <MenuItem icon="bell" tone="warning" label="Thông báo" onPress={() => router.push('/notifications')} />
          <MenuItem icon="receipt" tone="success" label="Phiếu thu của tôi" onPress={() => router.push('/receipts')} />
          <MenuItem
            icon="phone"
            tone="info"
            label="Hotline hỗ trợ"
            value={HOTLINE}
            onPress={() => void Linking.openURL(`tel:${HOTLINE.replace(/\s/g, '')}`)}
          />
        </Card>

        {/* Hành động nguy hiểm tách riêng khỏi danh sách menu và cần xác nhận. */}
        <Button title="Đăng xuất" variant="danger" leftIcon="logout" onPress={() => setLogoutOpen(true)} />
        <Text variant="caption" color={semantic.textMuted} align="center">
          BeeSky · {appVersionLabel()}
        </Text>
      </View>

      <ChangePasswordDialog visible={passwordOpen} userId={user.id} onClose={() => setPasswordOpen(false)} />
      <Dialog
        visible={logoutOpen}
        title="Đăng xuất?"
        onClose={() => setLogoutOpen(false)}
        actions={
          <>
            <Button title="Hủy" variant="ghost" onPress={() => setLogoutOpen(false)} disabled={signingOut} />
            <Button title="Đăng xuất" variant="danger" leftIcon="logout" loading={signingOut} onPress={() => void handleSignOut()} />
          </>
        }>
        <Text variant="body" color={semantic.textSecondary}>
          Bạn sẽ cần đăng nhập lại để xem hợp đồng và lịch thanh toán.
        </Text>
      </Dialog>
    </Screen>
  );
}

function MenuItem({ icon, tone, label, value, onPress }: { icon: IconName; tone: Tone; label: string; value?: string; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      onPress={onPress}
      {...hoverProps}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={({ pressed }) => [styles.menuItem, interactive, (pressed || hovered) && styles.menuActive]}>
      <IconCircle name={icon} tone={tone} size="sm" />
      <Text variant="bodyStrong" style={styles.flex}>
        {label}
      </Text>
      {value ? (
        <Text variant="captionStrong" color={semantic.textSecondary}>
          {value}
        </Text>
      ) : null}
      <Icon name="chevronRight" size="sm" color={semantic.iconMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: layout.profileMaxWidth, gap: spacing.ml },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius['3xl'],
    backgroundColor: semantic.inverse,
    ...shadows.raised,
  },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  cardTitle: { marginBottom: spacing.xs },
  menuTitle: { paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    minHeight: sizes.touchTarget + spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  menuActive: { backgroundColor: semantic.surfaceSunken },
});
