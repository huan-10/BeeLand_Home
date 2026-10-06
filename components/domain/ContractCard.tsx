import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, ProgressBar, Skeleton, Text } from '@/components/ui';
import { contractStatusText, unitLine } from '@/lib/contract';
import { formatCurrency, formatDate, formatDaysLeft, formatPercent } from '@/lib/format';
import { contractStatusMeta, contractTypeLabels } from '@/lib/labels';
import { isFullyPaid } from '@/lib/payment';
import { borderWidth, colors, fontSizes, radius, semantic, sizes, spacing, toneColors } from '@/theme';
import type { ContractListItem } from '@/types';

import { ProjectImage } from './ProjectImage';

export interface ContractCardProps {
  contract: ContractListItem;
  onPress?: () => void;
}

/**
 * Thẻ hợp đồng kiểu trưng bày (giống thẻ dự án app Beeland Sales):
 * - Ảnh thật của dự án tràn đầu thẻ, phủ tối dần: loại hợp đồng (viên kính) + trạng thái (badge) ở trên,
 *   tên dự án + căn ở dưới — khách nhận ra căn của mình ngay.
 * - Thân thẻ: mã hợp đồng + ngày ký, tiến độ thanh toán (% lớn, thanh tiến độ, đã trả / còn lại),
 *   đợt cần thanh toán tiếp theo (quá hạn tô đỏ). Chữ thiết yếu xuống dòng, không cắt.
 */
export function ContractCard({ contract, onPress }: ContractCardProps) {
  const status = contractStatusMeta[contract.status];
  const statusText = contractStatusText(contract, status.label);
  const { summary } = contract;
  const done = isFullyPaid(summary.paidPercent);
  const percent = formatPercent(summary.paidPercent);
  const next = done || contract.status === 'cancelled' ? null : summary.nextInstallment;
  const overdue = next?.status === 'overdue';

  return (
    <Card
      padding="none"
      onPress={onPress}
      hoverLift
      accessibilityLabel={`Hợp đồng ${contract.code}, ${contract.projectName}, ${unitLine(contract)}, ${statusText}, đã thanh toán ${percent}`}
      accessibilityHint="Mở chi tiết hợp đồng">
      {/* Ảnh cắt bo góc trên ở lớp riêng: thẻ không cần overflow hidden nên giữ được bóng trên iOS. */}
      <View style={styles.imageWrap}>
        <ProjectImage uri={contract.projectImageUrl} projectName={contract.projectName} height={sizes.projectImage}>
          <View style={styles.imageTop}>
            <View style={styles.typePill}>
              <Text variant="label" color={colors.white} style={styles.typeText}>
                {contractTypeLabels[contract.type].label}
              </Text>
            </View>
            <Badge label={statusText} tone={status.tone} dot />
          </View>
          <View style={styles.imageBottom}>
            <Text variant="heading" color={colors.white}>
              {contract.projectName}
            </Text>
            <View style={styles.metaItem}>
              <Icon name="home" size="sm" color={colors.white} />
              <Text variant="caption" color={colors.white} style={styles.flexText}>
                {unitLine(contract)}
              </Text>
            </View>
          </View>
        </ProjectImage>
      </View>

      <View style={styles.body}>
        <View style={styles.codeRow}>
          <View style={styles.flexText}>
            <Text variant="label" color={semantic.textMuted} style={styles.caps}>
              Mã hợp đồng
            </Text>
            <Text variant="subhead" selectable numeric numberOfLines={2}>
              {contract.code}
            </Text>
          </View>
          {contract.signedDate ? (
            <View style={styles.dateCol}>
              <Text variant="label" color={semantic.textMuted} style={styles.caps}>
                Ngày ký
              </Text>
              <Text variant="captionStrong" weight="semibold" numeric>
                {formatDate(contract.signedDate)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressHead}>
            <Text variant="caption" color={semantic.textSecondary}>
              Đã thanh toán
            </Text>
            <Text variant="title" numeric color={done ? semantic.textSuccess : semantic.textBrand}>
              {percent}
            </Text>
          </View>
          <ProgressBar
            value={summary.paidPercent}
            tone={done ? 'success' : 'primary'}
            accessibilityLabel={`Tiến độ thanh toán ${percent}${done ? ', đã tất toán' : ''}`}
          />
          <View style={styles.amountGrid}>
            <Amount label="Đã trả" value={formatCurrency(summary.paidAmount)} />
            <Amount label="Còn lại" value={formatCurrency(summary.remainingAmount)} align="right" strong={!done} />
          </View>
          <View style={styles.totalRow}>
            <Text variant="caption" color={semantic.textMuted}>
              Giá trị hợp đồng
            </Text>
            <Text variant="captionStrong" weight="semibold" numeric>
              {formatCurrency(contract.totalValue)}
            </Text>
          </View>
        </View>

        {next ? (
          <View style={[styles.next, overdue && styles.nextOverdue]}>
            <Icon name={overdue ? 'warning' : 'alarm'} variant="duotone" color={overdue ? toneColors.danger.fg : toneColors.primary.fg} />
            <View style={styles.flexText}>
              <Text variant="captionStrong" weight="semibold" color={overdue ? toneColors.danger.fg : semantic.text}>
                {next.name} · {formatCurrency(next.remainingAmount)}
              </Text>
              <Text variant="caption" color={overdue ? toneColors.danger.fg : semantic.textSecondary}>
                Hạn {formatDate(next.dueDate)} · {formatDaysLeft(next.daysUntilDue)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function Amount({ label, value, align, strong }: { label: string; value: string; align?: 'right'; strong?: boolean }) {
  return (
    <View style={[styles.amount, align === 'right' && styles.amountRight]}>
      <Text variant="label" color={semantic.textMuted} style={styles.caps}>
        {label}
      </Text>
      <Text variant="captionStrong" weight={strong ? 'bold' : 'semibold'} numeric align={align}>
        {value}
      </Text>
    </View>
  );
}

/** Skeleton cùng kích thước thẻ thật để không nhảy bố cục khi tải xong. */
export function ContractCardSkeleton() {
  return (
    <Card padding="none">
      <View style={styles.imageWrap}>
        <Skeleton height={sizes.projectImage} radius={radius.none} />
      </View>
      <View style={styles.body}>
        <Skeleton width="55%" height={fontSizes.heading.lineHeight} />
        <Skeleton width="80%" />
        <Skeleton width="45%" height={fontSizes.label.fontSize} />
        <Skeleton width="100%" height={sizes.progress.md} radius={radius.full} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  imageWrap: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], overflow: 'hidden' },
  imageTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  imageBottom: { gap: spacing.xs },
  typePill: {
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.overlay.glassOnImage,
    borderWidth: borderWidth.hairline,
    borderColor: colors.overlay.glassOnImageBorder,
  },
  typeText: { letterSpacing: 0 },
  body: { padding: spacing.ml, gap: spacing.md },
  codeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  dateCol: { alignItems: 'flex-end', gap: spacing.xs / 2 },
  caps: { textTransform: 'uppercase' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flexText: { flex: 1, minWidth: 0 },
  progressBlock: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: semantic.surfaceMuted,
  },
  progressHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  amountGrid: { flexDirection: 'row', gap: spacing.md },
  amount: { flex: 1, gap: spacing.xs / 2 },
  amountRight: { alignItems: 'flex-end' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    padding: spacing.ms,
    borderRadius: radius.xl,
    backgroundColor: toneColors.primary.bg,
  },
  nextOverdue: { backgroundColor: toneColors.danger.bg },
});
