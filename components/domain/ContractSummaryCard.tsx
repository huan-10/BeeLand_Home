import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, KeyValueRow, MoneySummaryCard, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { contractStatusMeta, contractTypeLabels } from '@/lib/labels';
import { isFullyPaid } from '@/lib/payment';
import { colors, interactive, opacity, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { ContractListItem } from '@/types';

import { useHover } from '@/hooks/useHover';

import { ProjectImage } from './ProjectImage';

export interface ContractSummaryCardProps {
  contract: ContractListItem;
  onOpenDocument: () => void;
  /** Hành động đặt cuối thẻ tổng tiền (desktop: nút "Thanh toán ngay"). */
  footer?: ReactNode;
}

/**
 * Phần đầu màn Chi tiết hợp đồng:
 * 1. Thẻ tổng tiền nền ink — mã, loại, trạng thái, dự án, giá trị, đã trả / còn lại, tiến độ.
 * 2. Thẻ căn hộ — ảnh dự án, căn, ngày ký, mã hợp đồng (chạm để sao chép), link PDF.
 */
export function ContractSummaryCard({ contract, onOpenDocument, footer }: ContractSummaryCardProps) {
  const docHover = useHover();
  const status = contractStatusMeta[contract.status];
  const { summary } = contract;
  const done = isFullyPaid(summary.paidPercent);
  const percent = formatPercent(summary.paidPercent);

  return (
    <View style={styles.stack}>
      <MoneySummaryCard
        header={
          <>
            <View style={styles.titleRow}>
              <View style={styles.flex}>
                <Text variant="heading" color={semantic.onInverse} selectable>
                  {contract.code}
                </Text>
                <Text variant="caption" color={semantic.onInverseMuted}>
                  {contractTypeLabels[contract.type].label}
                </Text>
              </View>
              <Badge label={status.label} tone={status.tone} dot size="md" />
            </View>
            <Text variant="subhead" color={semantic.onInverse}>
              {contract.projectName}
            </Text>
          </>
        }
        totalLabel="Giá trị hợp đồng"
        total={formatCurrency(contract.totalValue)}
        percent={summary.paidPercent}
        progressLabel={`Đã thanh toán ${percent}${done ? ' · đã tất toán' : ''}`}
        stats={[
          { label: 'Đã thanh toán', value: formatCurrency(summary.paidAmount) },
          { label: 'Còn phải thanh toán', value: formatCurrency(summary.remainingAmount), accent: !done },
        ]}
        footer={footer}
      />

      <Card padding="none">
        {/* Ảnh cắt bo góc trên ở lớp riêng để thẻ giữ được bóng trên iOS. */}
        <View style={styles.imageWrap}>
          <ProjectImage uri={contract.projectImageUrl} projectName={contract.projectName} height={sizes.projectImage} />
        </View>
        <View style={styles.body}>
          <View style={styles.meta}>
            <MetaRow icon="home" text={`Căn ${contract.unitCode} · ${contract.block} · Tầng ${contract.floor}`} />
            <MetaRow icon="calendar" text={`Ngày ký ${formatDate(contract.signedDate)}`} />
          </View>
          <KeyValueRow label="Mã hợp đồng" value={contract.code} copyable numeric last />
          <Pressable
            onPress={onOpenDocument}
            accessibilityRole="link"
            accessibilityLabel="Xem hợp đồng (PDF)"
            accessibilityHint="Mở tệp hợp đồng PDF"
            {...docHover.hoverProps}
            style={({ pressed }) => [styles.docRow, interactive, docHover.hovered && styles.docHover, pressed && styles.pressed]}>
            <Icon name="document" color={toneColors.primary.fg} />
            <Text variant="captionStrong" weight="semibold" color={semantic.textBrand} style={styles.flex}>
              Xem hợp đồng (PDF)
            </Text>
            <Icon name="external" size="sm" color={toneColors.primary.fg} />
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

function MetaRow({ icon, text }: { icon: 'home' | 'calendar'; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size="sm" color={semantic.textMuted} />
      <Text variant="caption" color={semantic.textSecondary} style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  imageWrap: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], overflow: 'hidden' },
  body: { padding: spacing.ml, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  meta: { gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.ms,
    borderRadius: radius.lg,
    backgroundColor: toneColors.primary.bg,
  },
  docHover: { backgroundColor: colors.primary[100] },
  pressed: { opacity: opacity.pressed },
});
