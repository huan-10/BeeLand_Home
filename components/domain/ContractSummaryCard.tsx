import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, KeyValueRow, Pressable, ProgressBar, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { contractStatusText, unitLine } from '@/lib/contract';
import { contractStatusMeta, contractTypeLabels } from '@/lib/labels';
import { isFullyPaid } from '@/lib/payment';
import { borderWidth, colors, interactive, opacity, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { ContractListItem } from '@/types';

import { useHover } from '@/hooks/useHover';

import { ProjectImage } from './ProjectImage';

export interface ContractSummaryCardProps {
  contract: ContractListItem;
  /** Không truyền → không có tệp hợp đồng, ẩn dòng "Xem hợp đồng (PDF)". */
  onOpenDocument?: () => void;
  /** Hành động đặt cuối thẻ (desktop: nút "Thanh toán ngay"). */
  footer?: ReactNode;
}

/**
 * Phần đầu màn Chi tiết hợp đồng — MỘT thẻ, mỗi thông tin xuất hiện một lần:
 * ảnh dự án (loại HĐ + trạng thái ở trên, dự án + căn ở dưới) → khối tiền (giá trị, tiến độ, đã trả / còn lại)
 * → mã hợp đồng (chạm để sao chép), ngày ký → link PDF.
 */
export function ContractSummaryCard({ contract, onOpenDocument, footer }: ContractSummaryCardProps) {
  const docHover = useHover();
  const status = contractStatusMeta[contract.status];
  const { summary } = contract;
  const done = isFullyPaid(summary.paidPercent);
  const percent = formatPercent(summary.paidPercent);

  return (
    <Card padding="none">
      {/* Ảnh cắt bo góc trên ở lớp riêng để thẻ giữ được bóng trên iOS. */}
      <View style={styles.imageWrap}>
        <ProjectImage uri={contract.projectImageUrl} projectName={contract.projectName} height={sizes.roundImage}>
          <View style={styles.imageTop}>
            <View style={styles.typePill}>
              <Text variant="label" color={colors.white} style={styles.typeText}>
                {contractTypeLabels[contract.type].label}
              </Text>
            </View>
            <Badge label={contractStatusText(contract, status.label)} tone={status.tone} dot />
          </View>
          <View style={styles.imageBottom}>
            <Text variant="heading" color={colors.white}>
              {contract.projectName}
            </Text>
            <View style={styles.imageMeta}>
              <Icon name="home" size="sm" color={colors.white} />
              <Text variant="caption" color={colors.white} style={styles.flex}>
                {unitLine(contract)}
              </Text>
            </View>
          </View>
        </ProjectImage>
      </View>

      <View style={styles.body}>
        <View style={styles.money}>
          <Text variant="caption" color={semantic.textSecondary}>
            Giá trị hợp đồng
          </Text>
          <Text variant="title" numeric>
            {formatCurrency(contract.totalValue)}
          </Text>
          <ProgressBar
            value={summary.paidPercent}
            tone={done ? 'success' : 'primary'}
            accessibilityLabel={`Đã thanh toán ${percent}${done ? ', đã tất toán' : ''}`}
          />
          <View style={styles.amounts}>
            <Amount label={`Đã trả · ${percent}`} value={formatCurrency(summary.paidAmount)} color={done ? semantic.textSuccess : undefined} />
            <Amount label="Còn lại" value={formatCurrency(summary.remainingAmount)} align="right" color={done ? undefined : semantic.textBrand} />
          </View>
        </View>

        <View>
          <KeyValueRow label="Mã hợp đồng" value={contract.code} copyable numeric last={!contract.signedDate} />
          {contract.signedDate ? <KeyValueRow label="Ngày ký" value={formatDate(contract.signedDate)} numeric last /> : null}
        </View>

        {onOpenDocument ? (
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
        ) : null}

        {footer}
      </View>
    </Card>
  );
}

function Amount({ label, value, align, color }: { label: string; value: string; align?: 'right'; color?: string }) {
  return (
    <View style={[styles.amount, align === 'right' && styles.amountRight]}>
      <Text variant="caption" color={semantic.textMuted}>
        {label}
      </Text>
      <Text variant="captionStrong" weight="bold" numeric align={align} color={color}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], overflow: 'hidden' },
  imageTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  imageBottom: { gap: spacing.xs },
  imageMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  typePill: {
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.overlay.glassOnImage,
    borderWidth: borderWidth.hairline,
    borderColor: colors.overlay.glassOnImageBorder,
  },
  typeText: { letterSpacing: 0 },
  body: { padding: spacing.md, gap: spacing.ms },
  money: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.xl, backgroundColor: semantic.surfaceMuted },
  amounts: { flexDirection: 'row', gap: spacing.md },
  amount: { flex: 1, gap: spacing.xs / 2 },
  amountRight: { alignItems: 'flex-end' },
  flex: { flex: 1, minWidth: 0 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.ms,
    borderRadius: radius.xl,
    backgroundColor: toneColors.primary.bg,
  },
  docHover: { backgroundColor: colors.primary[100] },
  pressed: { opacity: opacity.pressed },
});
