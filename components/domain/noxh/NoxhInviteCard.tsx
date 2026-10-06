import { StyleSheet, View } from 'react-native';

import { Button, IconCircle, Text } from '@/components/ui';
import { radius, semantic, shadows, spacing } from '@/theme';

/** Chưa có hồ sơ: lời mời đăng ký (thẻ ink duy nhất của trang NOXH). */
export function NoxhInviteCard({ openRounds, onPress }: { openRounds: number; onPress: () => void }) {
  return (
    <View style={styles.card}>
      <IconCircle name="building" tone="primary" size="xl" />
      <Text variant="title" color={semantic.onInverse} accessibilityRole="header">
        Đăng ký mua nhà ở xã hội
      </Text>
      <Text variant="body" color={semantic.onInverseMuted}>
        Nộp hồ sơ online, theo dõi xét duyệt và tự bốc thăm căn hộ ngay trên ứng dụng.
      </Text>
      <Text variant="captionStrong" color={semantic.onInverseAccent}>
        {openRounds > 0 ? `${openRounds} đợt đang nhận hồ sơ` : 'Chưa có đợt đang nhận hồ sơ'}
      </Text>
      <Button title="Xem đợt đang mở" variant="secondary" rightIcon="arrowRight" onPress={onPress} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: semantic.inverse, borderRadius: radius['3xl'], padding: spacing.lg, gap: spacing.sm, ...shadows.raised },
  button: { alignSelf: 'flex-start', marginTop: spacing.sm },
});
