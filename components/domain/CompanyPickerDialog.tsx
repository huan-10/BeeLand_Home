import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Dialog, Icon, IconCircle, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import type { CompanyOption } from '@/types';
import { borderWidth, interactive, radius, semantic, sizes, spacing, toneColors } from '@/theme';

export interface CompanyPickerDialogProps {
  visible: boolean;
  /** Mỗi hồ sơ khách hàng một dòng (`companyOptions`), theo thứ tự công ty. */
  companies: CompanyOption[];
  /** Hồ sơ đang xem (đánh dấu ✓). Không truyền khi chọn lần đầu lúc đăng nhập. */
  activeCompanyId?: string | null;
  activeCustomerId?: string | null;
  description?: string;
  onSelect: (companyId: string, customerId?: string) => Promise<void> | void;
  onClose: () => void;
}

const optionKey = (o: CompanyOption) => `${o.companyId}:${o.customerId ?? ''}`;

/**
 * Chọn / chuyển hồ sơ khách hàng khi một SĐT có nhiều hồ sơ (nhiều chủ đầu tư, hoặc nhiều hồ sơ trong một công ty — chung 1 tài khoản).
 * Nhóm theo công ty; dùng ở Đăng nhập và Cá nhân.
 */
export function CompanyPickerDialog({
  visible,
  companies,
  activeCompanyId,
  activeCustomerId,
  description,
  onSelect,
  onClose,
}: CompanyPickerDialogProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const groups = companies.reduce<{ companyId: string; companyName: string; items: CompanyOption[] }[]>((acc, o) => {
    const last = acc[acc.length - 1];
    if (last && last.companyId === o.companyId) last.items.push(o);
    else acc.push({ companyId: o.companyId, companyName: o.companyName, items: [o] });
    return acc;
  }, []);

  const select = async (o: CompanyOption) => {
    if (busyKey) return;
    setBusyKey(optionKey(o));
    try {
      await onSelect(o.companyId, o.customerId);
    } finally {
      setBusyKey(null);
    }
  };

  const isActive = (o: CompanyOption) =>
    o.companyId === activeCompanyId && (!o.customerId || !activeCustomerId || o.customerId === activeCustomerId);

  return (
    <Dialog visible={visible} title="Chọn hồ sơ khách hàng" onClose={onClose}>
      <Text variant="caption" color={semantic.textMuted}>
        {description ?? 'Số điện thoại của bạn có nhiều hồ sơ khách hàng. Chọn hồ sơ muốn xem và quản lý hợp đồng.'}
      </Text>
      <View style={styles.list}>
        {groups.map((g) => (
          <View key={g.companyId} style={styles.group}>
            <Text variant="label" color={semantic.textMuted} accessibilityRole="header">
              {g.companyName || 'Công ty'}
            </Text>
            {g.items.map((o) => (
              <CompanyRow
                key={optionKey(o)}
                company={o}
                active={isActive(o)}
                busy={busyKey === optionKey(o)}
                disabled={!!busyKey}
                onPress={() => void select(o)}
              />
            ))}
          </View>
        ))}
      </View>
    </Dialog>
  );
}

function CompanyRow({
  company,
  active,
  busy,
  disabled,
  onPress,
}: {
  company: CompanyOption;
  active: boolean;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { hovered, hoverProps } = useHover();
  const name = company.customerName || company.companyName || 'Khách hàng';
  const customer = [company.customerCode, company.companyName].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      {...hoverProps}
      accessibilityRole="button"
      accessibilityState={{ selected: active, busy, disabled }}
      accessibilityLabel={`${name}${customer ? `, ${customer}` : ''}${active ? ', đang xem' : ''}`}
      style={({ pressed }) => [styles.row, interactive, active && styles.rowActive, (pressed || hovered) && !disabled && styles.rowHover]}>
      <IconCircle name="user" tone="primary" size="sm" />
      <View style={styles.flex}>
        <Text variant="bodyStrong">{name}</Text>
        {customer ? (
          <Text variant="caption" color={semantic.textMuted}>
            {customer}
          </Text>
        ) : null}
      </View>
      {busy ? (
        <ActivityIndicator color={semantic.iconMuted} />
      ) : active ? (
        <Icon name="checkCircle" color={semantic.textBrand} />
      ) : (
        <Icon name="chevronRight" size="sm" color={semantic.iconMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, marginTop: spacing.ms },
  group: { gap: spacing.sm },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    minHeight: sizes.touchTarget + spacing.sm,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: borderWidth.hairline,
    borderColor: semantic.border,
  },
  rowActive: { borderColor: semantic.brand, backgroundColor: toneColors.primary.bg },
  rowHover: { backgroundColor: semantic.surfaceSunken },
});
