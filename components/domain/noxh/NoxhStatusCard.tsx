import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { noxhStatusMeta, stageProgress } from '@/lib/noxh';
import { colors, radius, semantic, shadows, sizes, spacing } from '@/theme';
import type { NoxhApplicationRow } from '@/types';

export interface NoxhStatusCardProps {
  row: Pick<NoxhApplicationRow, 'so_ho_so' | 'trang_thai' | 'ten_du_an' | 'ten_nhom'>;
  /** Đã quay bốc thăm (chặng 5 xong). */
  lotteryDone?: boolean;
  /** Dòng việc cần làm / ghi chú dưới thanh chặng. */
  note?: string;
  footer?: ReactNode;
}

/**
 * Thẻ trạng thái hồ sơ nền xanh đêm (một thẻ ink duy nhất trên màn): "Số hồ sơ" + badge cùng hàng, số hồ sơ, dự án · nhóm (2 dòng),
 * thanh 5 chặng (Nộp · Kiểm tra · Xác minh · Sở XD · Bốc thăm) kèm chữ "Bước n/5 · …".
 */
export function NoxhStatusCard({ row, lotteryDone = false, note, footer }: NoxhStatusCardProps) {
  const meta = noxhStatusMeta[row.trang_thai];
  const stage = stageProgress(row.trang_thai, lotteryDone);
  return (
    <View style={styles.card}>
      {/* "Số hồ sơ" + nhãn trạng thái cùng một hàng → thẻ thấp hơn. */}
      <View>
        <View style={styles.headRow}>
          <Text variant="caption" color={semantic.onInverseMuted} style={styles.flex}>
            Số hồ sơ
          </Text>
          <Badge label={meta.label} tone={meta.tone} dot />
        </View>
        <Text variant="title" numeric color={semantic.onInverse}>
          {row.so_ho_so}
        </Text>
      </View>
      <Text variant="caption" color={semantic.onInverse} numberOfLines={2}>
        {[row.ten_du_an, row.ten_nhom].filter(Boolean).join(' · ')}
      </Text>
      {stage ? (
        <View style={styles.stage}>
          <View
            style={styles.segments}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Bước ${stage.step}/${stage.total}: ${stage.current}`}
            accessibilityValue={{ min: 0, max: stage.total, now: stage.done }}>
            {Array.from({ length: stage.total }).map((_, i) => (
              <View key={i} style={[styles.segment, i < stage.done && styles.segmentDone]} />
            ))}
          </View>
          <Text variant="captionStrong" color={semantic.onInverseMuted}>
            Bước {stage.step}/{stage.total} · {stage.current}
          </Text>
        </View>
      ) : null}
      {note ? (
        <Text variant="captionStrong" color={semantic.onInverseAccent}>
          {note}
        </Text>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: semantic.inverse, borderRadius: radius['3xl'], padding: spacing.ml, gap: spacing.ms, ...shadows.raised },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  stage: { gap: spacing.xs },
  segments: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: sizes.progress.md, borderRadius: radius.full, backgroundColor: semantic.inverseTrack },
  segmentDone: { backgroundColor: colors.primary[500] },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
