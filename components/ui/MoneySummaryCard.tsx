import { Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, semantic, shadows, sizes, spacing } from '@/theme';

import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

export interface MoneyStat {
  label: string;
  /** Đã định dạng sẵn qua `lib/format.ts`. */
  value: string;
  /** Tô màu mật ong để nhấn mạnh (vd "Còn lại"). */
  accent?: boolean;
}

export interface MoneySummaryCardProps {
  /** Phần đầu thẻ: mã hợp đồng, tên dự án, badge trạng thái… (đặt chữ `onInverse`). */
  header?: ReactNode;
  totalLabel: string;
  /** Tổng tiền đã định dạng, ví dụ "2.500.000.000 đ". */
  total: string;
  /** 0 – 100. */
  percent: number;
  /** Mô tả tiến độ có chữ, ví dụ "Đã thanh toán 50%". */
  progressLabel: string;
  stats: MoneyStat[];
  footer?: ReactNode;
}

/**
 * Thẻ tổng tiền nền nâu đen "ink" (bản sắc BeeSky: ong đen + mật cam), bo 28, bóng `raised`.
 * Thanh tiến độ cam khi đang trả, xanh lá khi đã đủ; luôn kèm chữ phần trăm.
 */
export function MoneySummaryCard({ header, totalLabel, total, percent, progressLabel, stats, footer }: MoneySummaryCardProps) {
  const done = percent >= 100;
  return (
    <View style={styles.card}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <View style={styles.totalBlock}>
        <Text variant="caption" color={semantic.onInverseMuted}>
          {totalLabel}
        </Text>
        <Text variant="display" numeric color={semantic.onInverse}>
          {total}
        </Text>
      </View>
      <View style={styles.progress}>
        <ProgressBar value={percent} tone={done ? 'success' : 'primary'} onInverse accessibilityLabel={progressLabel} />
        <Text variant="captionStrong" color={semantic.onInverseMuted}>
          {progressLabel}
        </Text>
      </View>
      <View style={styles.stats}>
        {stats.map((s, i) => (
          <Fragment key={s.label}>
            {i > 0 ? <View style={styles.statDivider} /> : null}
            <View style={styles.stat}>
              <Text variant="caption" color={semantic.onInverseMuted}>
                {s.label}
              </Text>
              <Text variant="subhead" numeric color={s.accent ? semantic.onInverseAccent : semantic.onInverse}>
                {s.value}
              </Text>
            </View>
          </Fragment>
        ))}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: semantic.inverse,
    borderRadius: radius['3xl'],
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.raised,
  },
  header: { gap: spacing.sm },
  totalBlock: { gap: spacing.xs },
  progress: { gap: spacing.sm },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: semantic.inverseDivider },
  stat: { flexGrow: 1, flexBasis: 0, minWidth: sizes.moneyCard.statMinWidth, gap: spacing.xs },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: semantic.inverseDivider },
  footer: { gap: spacing.sm },
});
