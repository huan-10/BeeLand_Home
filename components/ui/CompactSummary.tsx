import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, semantic, shadows, spacing } from '@/theme';

import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

export interface CompactSummaryProps {
  /** Nhãn nhỏ, ví dụ "Cần thanh toán · 36 đợt". */
  label: string;
  /** Giá trị chính đã định dạng, ví dụ "47.701.318.101 đ". */
  value: string;
  /** Màu giá trị (mặc định chữ chính). */
  valueColor?: string;
  /** Nội dung bên phải (vd "Đã trả 1%"). */
  aside?: ReactNode;
  /** 0–100: thanh tiến độ mảnh dưới dòng. */
  progress?: number;
  progressLabel?: string;
}

/** Dòng tổng quan gọn hiện trong thanh bám dính khi thẻ tổng quan lớn đã cuộn khỏi màn hình. */
export function CompactSummary({ label, value, valueColor, aside, progress, progressLabel }: CompactSummaryProps) {
  return (
    <View style={[styles.card, shadows.soft]} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.row}>
        <View style={styles.main}>
          <Text variant="label" color={semantic.textMuted} numberOfLines={1} style={styles.label}>
            {label}
          </Text>
          <Text variant="subhead" weight="bold" numeric color={valueColor}>
            {value}
          </Text>
        </View>
        {aside ? <View style={styles.aside}>{aside}</View> : null}
      </View>
      {progress !== undefined ? <ProgressBar value={progress} size="sm" accessibilityLabel={progressLabel ?? `${Math.round(progress)}%`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
    borderRadius: radius.xl,
    backgroundColor: semantic.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  main: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
  label: { letterSpacing: 0 },
  aside: { alignItems: 'flex-end' },
});
