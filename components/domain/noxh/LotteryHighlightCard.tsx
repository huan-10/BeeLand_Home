import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, IconCircle, Text } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useBoundaryRerender } from '@/hooks/useServerClock';
import { lotteryPhase, lotteryPhaseMeta, nextBoundaryMs } from '@/lib/noxh';
import { semantic, spacing } from '@/theme';
import type { NoxhLotteryItem } from '@/types';

import { Countdown } from './Countdown';

export interface LotteryHighlightCardProps {
  item: NoxhLotteryItem;
  /** Giờ máy chủ. */
  now: () => number;
  onPress: () => void;
  /** Tới mốc mở/đóng → tải lại lượt (một lần). */
  onBoundary?: () => void;
}

/** Thẻ lượt bốc thăm sắp diễn ra / đang mở: khung giờ + đếm ngược + nút vào phòng bốc thăm. */
export function LotteryHighlightCard({ item, now, onPress, onBoundary }: LotteryHighlightCardProps) {
  const phase = lotteryPhase(item, now());
  // Đổi badge / nút đúng giây mở-đóng (không chờ tải lại dữ liệu).
  useBoundaryRerender(nextBoundaryMs(item, now()));
  const meta = lotteryPhaseMeta[phase];
  const open = phase === 'open';
  const target = Date.parse(open ? item.den_ngay : item.tu_ngay);
  return (
    <Card padding="ml" radius="3xl">
      <View style={styles.row}>
        <IconCircle name={open ? 'trophy' : 'timer'} tone={open ? 'success' : 'primary'} size="xl" />
        <View style={styles.flex}>
          <Badge label={meta.label} tone={meta.tone} dot />
          <Text variant="heading" accessibilityRole="header">
            {item.ten}
          </Text>
          <Text variant="caption" color={semantic.textMuted} numberOfLines={2}>
            Hồ sơ {item.so_ho_so}
          </Text>
          <Text variant="caption" color={semantic.textSecondary} numeric>
            {formatDateTime(item.tu_ngay)} – {formatDateTime(item.den_ngay)}
          </Text>
        </View>
      </View>
      <View style={styles.countdown}>
        <Text variant="captionStrong" color={semantic.textMuted}>
          {open ? 'Kết thúc sau' : 'Bắt đầu sau'}
        </Text>
        <Countdown targetMs={target} now={now} onElapsed={onBoundary} label={open ? 'Kết thúc sau' : 'Bắt đầu sau'} variant="title" />
      </View>
      <Button title={open ? 'Bốc thăm ngay' : 'Vào phòng bốc thăm'} rightIcon="arrowRight" onPress={onPress} fullWidth />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs, alignItems: 'flex-start' },
  countdown: { marginVertical: spacing.md, gap: spacing.xs },
});
