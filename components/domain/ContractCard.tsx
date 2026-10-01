import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, ProgressBar, Skeleton, Text } from '@/components/ui';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { contractStatusMeta, contractTypeLabels } from '@/lib/labels';
import { isFullyPaid } from '@/lib/payment';
import { fontSizes, radius, semantic, sizes, spacing } from '@/theme';
import type { ContractListItem } from '@/types';

import { ProjectImage } from './ProjectImage';

export interface ContractCardProps {
  contract: ContractListItem;
  onPress?: () => void;
}

/**
 * Thẻ hợp đồng: ảnh dự án, mã, dự án, căn hộ, badge trạng thái (có chữ), ngày ký, giá trị,
 * đã thanh toán (số tiền + %), thanh tiến độ (cam khi đang trả, xanh lá khi 100%).
 * Mã và tên dự án dài được xuống dòng đầy đủ, không cắt chữ.
 */
export function ContractCard({ contract, onPress }: ContractCardProps) {
  const status = contractStatusMeta[contract.status];
  const { summary } = contract;
  const done = isFullyPaid(summary.paidPercent);
  const percent = formatPercent(summary.paidPercent);

  return (
    <Card
      padding="none"
      onPress={onPress}
      hoverLift
      accessibilityLabel={`Hợp đồng ${contract.code}, ${contract.projectName}, căn ${contract.unitCode}, ${status.label}, đã thanh toán ${percent}`}
      accessibilityHint="Mở chi tiết hợp đồng">
      {/* Ảnh cắt bo góc trên ở lớp riêng: thẻ không cần overflow hidden nên giữ được bóng trên iOS. */}
      <View style={styles.imageWrap}>
        <ProjectImage uri={contract.projectImageUrl} projectName={contract.projectName} height={sizes.projectImage} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text variant="heading" selectable>
              {contract.code}
            </Text>
            <Text variant="caption" color={semantic.textMuted}>
              {contractTypeLabels[contract.type].label}
            </Text>
          </View>
          <Badge label={status.label} tone={status.tone} dot />
        </View>

        <Text variant="bodyStrong" weight="semibold">
          {contract.projectName}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Icon name="home" size="sm" color={semantic.iconMuted} />
            <Text variant="caption" color={semantic.textSecondary} style={styles.flexText}>
              Căn {contract.unitCode} · {contract.block}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="calendar" size="sm" color={semantic.iconMuted} />
            <Text variant="caption" color={semantic.textSecondary}>
              Ngày ký {formatDate(contract.signedDate)}
            </Text>
          </View>
        </View>

        <View style={styles.amounts}>
          <View style={styles.amountRow}>
            <Text variant="caption" color={semantic.textMuted}>
              Giá trị hợp đồng
            </Text>
            <Text variant="captionStrong" weight="bold" align="right" numeric style={styles.flexText}>
              {formatCurrency(contract.totalValue)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text variant="caption" color={semantic.textMuted}>
              Đã thanh toán
            </Text>
            <Text variant="captionStrong" weight="bold" align="right" numeric style={styles.flexText}>
              {formatCurrency(summary.paidAmount)}{' '}
              <Text variant="captionStrong" weight="bold" color={done ? semantic.textSuccess : semantic.textBrand}>
                ({percent})
              </Text>
            </Text>
          </View>
          <ProgressBar
            value={summary.paidPercent}
            tone={done ? 'success' : 'primary'}
            accessibilityLabel={`Tiến độ thanh toán ${percent}${done ? ', đã tất toán' : ''}`}
          />
        </View>
      </View>
    </Card>
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
  body: { padding: spacing.ml, gap: spacing.ms },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleCol: { flex: 1, minWidth: 0, gap: spacing.xs },
  meta: { gap: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flexText: { flex: 1, minWidth: 0 },
  amounts: {
    gap: spacing.sm,
    paddingTop: spacing.ms,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.ms },
});
