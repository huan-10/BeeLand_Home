import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { ChangePasswordDialog, CompanyPickerDialog, ConnectNoxhDialog } from '@/components/domain';
import { Screen } from '@/components/layout';
import { Avatar, Button, Card, Dialog, Icon, IconCircle, KeyValueRow, Pressable, QuickActions, ScreenHeader, Text, useToast, type QuickAction } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useHover } from '@/hooks/useHover';
import { appVersionLabel } from '@/lib/appInfo';
import { APP_MODULE_GROUPS, APP_MODULES } from '@/lib/appModules';
import { interactive, layout, radius, semantic, shadows, sizes, spacing, type IconName, type Tone } from '@/theme';

const HOTLINE = '1900 6868';

/** Mục "Quản lý": mọi chức năng (danh mục chung `lib/appModules`), mỗi nhóm một dòng xổ xuống. */
const MANAGE_GROUPS = APP_MODULE_GROUPS.map((g) => ({ ...g, items: APP_MODULES.filter((m) => m.group === g.id) }));

export default function ProfileScreen() {
  const { user, signOut, companies, activeCompanyId, selectCompany, noxhNeedsConnect } = useAuth();
  const toast = useToast();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [noxhOpen, setNoxhOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === activeCompanyId) {
      setCompanyOpen(false);
      return;
    }
    await selectCompany(companyId);
    setCompanyOpen(false);
    const name = companies.find((c) => c.companyId === companyId)?.companyName;
    toast.show(name ? `Đã chuyển sang ${name}` : 'Đã chuyển công ty', 'success');
  };

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

        {/* Quản lý: mọi chức năng, mỗi nhóm một dòng xổ xuống → lưới icon gọn. */}
        <Card padding="sm">
          <View style={styles.manageHead}>
            <Text variant="label" color={semantic.textMuted} accessibilityRole="header" style={styles.flex}>
              Quản lý
            </Text>
            {/* Chọn chức năng hiện ở Trang chủ + thứ tự (lưu theo tài khoản). */}
            <Pressable
              onPress={() => router.push('/tuy-chinh-trang-chu')}
              accessibilityRole="button"
              accessibilityLabel="Tuỳ chỉnh chức năng hiển thị ở Trang chủ"
              hitSlop={spacing.sm}
              style={({ pressed }) => [styles.customize, interactive, pressed && styles.menuActive]}>
              <Icon name="sliders" size="sm" color={semantic.textBrand} />
              <Text variant="captionStrong" weight="semibold" color={semantic.textBrand}>
                Tuỳ chỉnh
              </Text>
            </Pressable>
          </View>
          {MANAGE_GROUPS.map((g) => (
            <ManageGroup
              key={g.title}
              title={g.title}
              icon={g.icon}
              open={!!openGroups[g.title]}
              onToggle={() => setOpenGroups((o) => ({ ...o, [g.title]: !o[g.title] }))}
              items={g.items.map((i) => ({ label: i.short, icon: i.icon, onPress: () => router.push(i.href, { withAnchor: true }) }))}
            />
          ))}
        </Card>

        <Card>
          <Text variant="label" color={semantic.textMuted} accessibilityRole="header" style={styles.cardTitle}>
            Thông tin tài khoản
          </Text>
          {user.companyName ? <KeyValueRow label="Công ty" value={user.companyName} /> : null}
          <KeyValueRow label="Mã khách hàng" value={user.customerCode} copyable numeric />
          <KeyValueRow label="Email" value={user.email} copyable />
          <KeyValueRow label="Số điện thoại" value={user.phone} copyable numeric />
          <KeyValueRow label="CCCD" value={user.idNumber || '—'} />
          <KeyValueRow label="Địa chỉ" value={user.address || '—'} last />
        </Card>

        {/* Một SĐT là khách của nhiều chủ đầu tư → chuyển công ty không cần đăng nhập lại. */}
        {companies.length > 1 ? (
          <Card padding="sm">
            <Text variant="label" color={semantic.textMuted} accessibilityRole="header" style={styles.menuTitle}>
              Công ty ({companies.length})
            </Text>
            <MenuItem icon="building" tone="primary" label="Chuyển công ty" value={user.companyName} onPress={() => setCompanyOpen(true)} />
          </Card>
        ) : null}

        <Card padding="sm">
          <Text variant="label" color={semantic.textMuted} accessibilityRole="header" style={styles.menuTitle}>
            Bảo mật & hỗ trợ
          </Text>
          <MenuItem
            icon="building"
            tone="primary"
            label="Nhà ở xã hội"
            value={noxhNeedsConnect ? 'Kết nối' : 'Đã kết nối'}
            onPress={() => (noxhNeedsConnect ? setNoxhOpen(true) : router.navigate('/noxh'))}
          />
          <MenuItem icon="key" tone="primary" label="Đổi mật khẩu" onPress={() => setPasswordOpen(true)} />
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
      <CompanyPickerDialog
        visible={companyOpen}
        companies={companies}
        activeCompanyId={activeCompanyId}
        onSelect={handleSwitchCompany}
        onClose={() => setCompanyOpen(false)}
      />
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
      <ConnectNoxhDialog visible={noxhOpen} onClose={() => setNoxhOpen(false)} />
    </Screen>
  );
}

/** Một nhóm của "Quản lý": dòng tiêu đề (icon · tên · số mục · mũi tên) bấm để xổ / thu lưới chức năng. */
function ManageGroup({ title, icon, open, onToggle, items }: { title: string; icon: IconName; open: boolean; onToggle: () => void; items: QuickAction[] }) {
  const { hovered, hoverProps } = useHover();
  return (
    <View>
      <Pressable
        onPress={onToggle}
        {...hoverProps}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${items.length} mục`}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        style={({ pressed }) => [styles.menuItem, interactive, (pressed || hovered) && styles.menuActive]}>
        <IconCircle name={icon} tone="primary" size="sm" />
        <Text variant="bodyStrong" style={styles.flex}>
          {title}
        </Text>
        <Text variant="captionStrong" color={semantic.textSecondary}>
          {items.length} mục
        </Text>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" color={semantic.iconMuted} />
      </Pressable>
      {open ? <QuickActions bare size="sm" accessibilityLabel={title} items={items} /> : null}
    </View>
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
  manageHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.sm, paddingTop: spacing.xs },
  customize: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  menuTitle: { paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    minHeight: sizes.touchTarget + spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
  },
  menuActive: { backgroundColor: semantic.surfaceSunken },
});
