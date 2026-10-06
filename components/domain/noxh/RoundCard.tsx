import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Text } from '@/components/ui';
import { formatDate, formatNumber } from '@/lib/format';
import { roundDaysLeft, roundStatusMeta } from '@/lib/noxh';
import { radius, semantic, sizes, spacing, type IconName } from '@/theme';
import type { NoxhRound } from '@/types';

import { ProjectImage } from '../ProjectImage';

/**
 * Thẻ đợt nhận hồ sơ — dạng ngang gọn: ảnh dự án vuông `sizes.roundThumb` bên trái; bên phải tình trạng + thời hạn,
 * tên đợt (2 dòng), dự án · chủ đầu tư (1 dòng), khung thời gian và "n căn · n hồ sơ".
 */
export function RoundCard({ round, now, onPress }: { round: NoxhRound; now: number; onPress: () => void }) {
  const meta = roundStatusMeta[round.tinh_trang];
  const daysLeft = roundDaysLeft(round, now);
  const timing =
    round.tinh_trang === 'DANG_MO' ? `Còn ${daysLeft} ngày` : round.tinh_trang === 'SAP_MO' ? `Mở ngày ${formatDate(round.tu_ngay)}` : null;
  const counts = [round.so_can != null ? `${formatNumber(round.so_can)} căn` : null, `${formatNumber(round.so_ho_so_da_nop)} hồ sơ`].filter(Boolean).join(' · ');
  return (
    <Card
      padding="sm"
      radius="2xl"
      hoverLift
      onPress={onPress}
      accessibilityLabel={`${round.ten}, ${meta.label}${timing ? `, ${timing}` : ''}, ${round.ten_chu_dau_tu}`}
      style={styles.card}>
      <ProjectImage uri={round.anh_url ?? undefined} projectName={round.ten_du_an ?? round.ten} height={sizes.roundThumb} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.badges}>
          <Badge label={meta.label} tone={meta.tone} dot />
          {timing ? (
            <Text variant="captionStrong" color={round.tinh_trang === 'DANG_MO' ? semantic.textBrand : semantic.textMuted}>
              {timing}
            </Text>
          ) : null}
        </View>
        <Text variant="subhead" weight="semibold" numberOfLines={2}>
          {round.ten}
        </Text>
        <Text variant="caption" color={semantic.textMuted} numberOfLines={1}>
          {[round.ten_du_an, round.ten_chu_dau_tu].filter(Boolean).join(' · ')}
        </Text>
        <MetaItem icon="calendar" text={`${formatDate(round.tu_ngay)} – ${formatDate(round.den_ngay)}`} />
        <MetaItem icon="users" text={counts} />
      </View>
    </Card>
  );
}

function MetaItem({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Icon name={icon} size="sm" color={semantic.icon} />
      <Text variant="caption" color={semantic.textSecondary} numeric>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.ms },
  image: { width: sizes.roundThumb, borderRadius: radius.xl, overflow: 'hidden' },
  body: { flex: 1, minWidth: 0, gap: spacing.xs / 2, paddingVertical: spacing.xs },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
