import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, ProgressBar, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { contractStatusMeta, contractTypeLabels } from '@/lib/labels';
import { isFullyPaid } from '@/lib/payment';
import { borderWidth, interactive, opacity, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { ContractListItem } from '@/types';

import { useHover } from '@/hooks/useHover';

import { ProjectImage } from './ProjectImage';

export interface ContractSummaryCardProps {
  contract: ContractListItem;
  onOpenDocument: () => void;
  /** Hành động phụ đặt cuối thẻ (desktop: nút "Thanh toán ngay"). */
  footer?: ReactNode;
}

/** Phần đầu màn Chi tiết hợp đồng: ảnh, mã, trạng thái, căn hộ, số tiền, tiến độ, link PDF. */
export function ContractSummaryCard({ contract, onOpenDocument, footer }: ContractSummaryCardProps) {
  const docHover = useHover();
  const status = contractStatusMeta[contract.status];
  const { summary } = contract;
  const done = isFullyPaid(summary.paidPercent);
  const percent = formatPercent(summary.paidPercent);

  return (
    <Card padding="none" style={styles.card}>
      <ProjectImage uri={contract.projectImageUrl} projectName={contract.projectName} height={sizes.projectImage} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text variant="h2" selectable>
              {contract.code}
            </Text>
            <Text variant="caption" color={semantic.textMuted}>
              {contractTypeLabels[contract.type].label}
            </Text>
          </View>
          <Badge label={status.label} tone={status.tone} dot size="md" />
        </View>

        <Text variant="bodyMedium" weight="semibold">
          {contract.projectName}
        </Text>
        <View style={styles.meta}>
          <MetaRow icon="home-outline" text={`Căn ${contract.unitCode} · ${contract.block} · Tầng ${contract.floor}`} />
          <MetaRow icon="calendar-outline" text={`Ngày ký ${formatDate(contract.signedDate)}`} />
        </View>

        <View style={styles.amounts}>
          <AmountRow label="Giá trị hợp đồng" value={formatCurrency(contract.totalValue)} />
          <AmountRow
            label="Đã thanh toán"
            value={`${formatCurrency(summary.paidAmount)} (${percent})`}
            color={done ? semantic.textSuccess : semantic.textBrand}
          />
          <AmountRow label="Còn phải thanh toán" value={formatCurrency(summary.remainingAmount)} />
          <ProgressBar
            value={summary.paidPercent}
            tone={done ? 'success' : 'primary'}
            accessibilityLabel={`Tiến độ thanh toán ${percent}${done ? ', đã tất toán' : ''}`}
          />
        </View>

        <Pressable
          onPress={onOpenDocument}
          accessibilityRole="link"
          accessibilityLabel="Xem hợp đồng (PDF)"
          accessibilityHint="Mở tệp hợp đồng PDF"
          {...docHover.hoverProps}
          style={({ pressed }) => [styles.docRow, interactive, docHover.hovered && styles.docHover, pressed && styles.pressed]}>
          <Icon name="document-text-outline" color={toneColors.primary.fg} />
          <Text variant="smallMedium" weight="semibold" color={semantic.textBrand} style={styles.flex}>
            Xem hợp đồng (PDF)
          </Text>
          <Icon name="open-outline" size="sm" color={toneColors.primary.fg} />
        </Pressable>

        {footer}
      </View>
    </Card>
  );
}

function MetaRow({ icon, text }: { icon: 'home-outline' | 'calendar-outline'; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size="sm" color={semantic.iconMuted} />
      <Text variant="small" color={semantic.textSecondary} style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

function AmountRow({ label, value, color = semantic.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.amountRow}>
      <Text variant="small" color={semantic.textMuted}>
        {label}
      </Text>
      <Text variant="smallMedium" weight="bold" color={color} align="right" style={styles.flex}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  body: { padding: spacing.md, gap: spacing.ms },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  meta: { gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  amounts: { gap: spacing.sm, paddingTop: spacing.ms, borderTopWidth: borderWidth.hairline, borderTopColor: semantic.borderSubtle },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.ms },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.ms,
    borderRadius: radius.md,
    backgroundColor: toneColors.primary.bg,
  },
  docHover: { backgroundColor: toneColors.primary.border },
  pressed: { opacity: opacity.pressed },
});
