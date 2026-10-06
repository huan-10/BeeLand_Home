import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Dialog, Icon, IconCircle, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import type { CompanyOption } from '@/types';
import { borderWidth, interactive, radius, semantic, sizes, spacing, toneColors } from '@/theme';

export interface CompanyPickerDialogProps {
  visible: boolean;
  companies: CompanyOption[];
  /** Công ty đang xem (đánh dấu ✓). Không truyền khi chọn lần đầu lúc đăng nhập. */
  activeCompanyId?: string | null;
  description?: string;
  onSelect: (companyId: string) => Promise<void> | void;
  onClose: () => void;
}

/** Chọn / chuyển công ty khi một SĐT là khách của nhiều chủ đầu tư — dùng ở Đăng nhập và Cá nhân. */
export function CompanyPickerDialog({ visible, companies, activeCompanyId, description, onSelect, onClose }: CompanyPickerDialogProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const select = async (companyId: string) => {
    if (busyId) return;
    setBusyId(companyId);
    try {
      await onSelect(companyId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog visible={visible} title="Chọn công ty" onClose={onClose}>
      <Text variant="caption" color={semantic.textMuted}>
        {description ?? 'Số điện thoại của bạn là khách hàng của nhiều chủ đầu tư. Chọn công ty muốn xem và quản lý hợp đồng.'}
      </Text>
      <View style={styles.list}>
        {companies.map((c) => (
          <CompanyRow
            key={c.companyId}
            company={c}
            active={c.companyId === activeCompanyId}
            busy={busyId === c.companyId}
            disabled={!!busyId}
            onPress={() => void select(c.companyId)}
          />
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
  const name = company.companyName || 'Công ty';
  const customer = [company.customerName, company.customerCode].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      {...hoverProps}
      accessibilityRole="button"
      accessibilityState={{ selected: active, busy, disabled }}
      accessibilityLabel={`${name}${customer ? `, ${customer}` : ''}${active ? ', đang xem' : ''}`}
      style={({ pressed }) => [styles.row, interactive, active && styles.rowActive, (pressed || hovered) && !disabled && styles.rowHover]}>
      <IconCircle name="building" tone="primary" size="sm" />
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
  list: { gap: spacing.sm, marginTop: spacing.ms },
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
