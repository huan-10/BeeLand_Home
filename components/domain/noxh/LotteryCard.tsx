import { StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Text } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useBoundaryRerender } from '@/hooks/useServerClock';
import { lotteryPhase, lotteryPhaseMeta, nextBoundaryMs } from '@/lib/noxh';
import { semantic, spacing } from '@/theme';
import type { NoxhLotteryItem } from '@/types';

import { Countdown } from './Countdown';

/** Thẻ một lượt bốc thăm trong "Bốc thăm của tôi". */
export function LotteryCard({ item, now, onPress, onBoundary }: { item: NoxhLotteryItem; now: () => number; onPress: () => void; onBoundary?: () => void }) {
  const phase = lotteryPhase(item, now());
  // Đổi badge / nút đúng giây mở-đóng (không chờ tải lại dữ liệu).
  useBoundaryRerender(nextBoundaryMs(item, now()));
  const meta = lotteryPhaseMeta[phase];
  const result =
    item.da_quay && item.ket_qua
      ? item.ket_qua === 'TRUNG'
        ? `Trúng căn ${item.can?.ky_hieu ?? ''}`
        : `Chưa trúng · dự phòng số ${item.thu_tu_du_phong ?? '—'}`
      : null;
  return (
    <Card hoverLift onPress={onPress} accessibilityLabel={`${item.ten}, ${meta.label}${result ? `, ${result}` : ''}, hồ sơ ${item.so_ho_so}`}>
      <View style={styles.top}>
        <Badge label={meta.label} tone={meta.tone} dot />
        <Text variant="caption" color={semantic.textMuted} numeric>
          {item.ma_dot}
        </Text>
      </View>
      <Text variant="heading" style={styles.title}>
        {item.ten}
      </Text>
      <Text variant="caption" color={semantic.textMuted} numberOfLines={2}>
        Hồ sơ {item.so_ho_so} · {[item.ten_du_an, item.ten_loai_can].filter(Boolean).join(' · ')}
      </Text>
      <Text variant="caption" color={semantic.textSecondary} numeric>
        {formatDateTime(item.tu_ngay)} – {formatDateTime(item.den_ngay)}
      </Text>
      <View style={styles.bottom}>
        {phase === 'upcoming' ? (
          <View style={styles.flex}>
            <Text variant="caption" color={semantic.textMuted}>
              Bắt đầu sau
            </Text>
            <Countdown targetMs={Date.parse(item.tu_ngay)} now={now} onElapsed={onBoundary} label="Bắt đầu sau" variant="subhead" />
          </View>
        ) : result ? (
          <Text variant="subhead" color={item.ket_qua === 'TRUNG' ? semantic.textSuccess : semantic.textBrand} style={styles.flex}>
            {result}
          </Text>
        ) : phase === 'open' ? (
          <Text variant="subhead" color={semantic.textBrand} style={styles.flex}>
            Đang mở — bốc thăm ngay
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        <Icon name="chevronRight" size="sm" variant="bold" color={semantic.iconMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { marginTop: spacing.sm },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.ms, paddingTop: spacing.ms, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: semantic.border },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
});
