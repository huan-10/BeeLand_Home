import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, ProgressBar, Text } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { noxhStatusMeta } from '@/lib/noxh';
import { colors, semantic, spacing } from '@/theme';
import type { NoxhApplicationRow } from '@/types';

/** Thẻ hồ sơ trong "Hồ sơ của tôi": số hồ sơ, trạng thái, dự án · đợt, tiến độ giấy tờ, cảnh báo bổ sung. */
export function ApplicationCard({ row, onPress }: { row: NoxhApplicationRow; onPress: () => void }) {
  const meta = noxhStatusMeta[row.trang_thai];
  const percent = row.so_giay_to ? Math.round((row.so_da_nop / row.so_giay_to) * 100) : 0;
  const docsLabel = `Đã nộp ${row.so_da_nop}/${row.so_giay_to} giấy tờ`;
  const needSupplement = row.trang_thai === 'CAN_BO_SUNG' && row.so_can_bo_sung > 0;
  return (
    <Card hoverLift onPress={onPress} accessibilityLabel={`Hồ sơ ${row.so_ho_so}, ${meta.label}, ${row.ten_du_an ?? ''}, ${docsLabel}`}>
      <View style={styles.top}>
        <Text variant="subhead" numeric numberOfLines={2}>
          {row.so_ho_so}
        </Text>
        <Badge label={meta.label} tone={meta.tone} dot />
      </View>
      <Text variant="bodyStrong" style={styles.gapTop}>
        {row.ten_du_an}
      </Text>
      <Text variant="caption" color={semantic.textMuted}>
        {[row.ten_dot, row.ten_nhom].filter(Boolean).join(' · ')}
      </Text>
      <View style={styles.progress}>
        <ProgressBar value={percent} size="sm" tone={percent >= 100 ? 'success' : 'primary'} accessibilityLabel={docsLabel} />
        <View style={styles.row}>
          <Text variant="caption" color={semantic.textSecondary} style={styles.flex}>
            {docsLabel}
          </Text>
          <Text variant="caption" color={semantic.textMuted} numeric>
            {row.trang_thai === 'NHAP' ? `Tạo ${formatDate(row.updated_at)}` : `Nộp ${formatDate(row.ngay_tiep_nhan)}`}
          </Text>
        </View>
      </View>
      {needSupplement ? (
        <View style={styles.warning}>
          <Icon name="warning" size="sm" color={colors.warning[700]} accessibilityLabel="Cảnh báo" />
          <Text variant="captionStrong" color={colors.warning[700]}>
            Cần bổ sung {row.so_can_bo_sung} giấy tờ
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  gapTop: { marginTop: spacing.sm },
  progress: { gap: spacing.sm, marginTop: spacing.ms },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  warning: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.ms },
});
