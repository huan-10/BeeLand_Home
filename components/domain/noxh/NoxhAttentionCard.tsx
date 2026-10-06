import { StyleSheet, View } from 'react-native';

import { Card, Icon, IconCircle, Text } from '@/components/ui';
import type { NoxhAttention } from '@/lib/noxh';
import { semantic, spacing, toneColors } from '@/theme';

const META = {
  supplement: { tone: 'warning', icon: 'warning', label: 'Hồ sơ nhà ở xã hội cần bổ sung' },
  lottery_open: { tone: 'success', icon: 'trophy', label: 'Đang mở bốc thăm' },
  lottery_soon: { tone: 'primary', icon: 'timer', label: 'Sắp đến giờ bốc thăm' },
} as const;

/** Thẻ nhắc việc Nhà ở xã hội ở Trang chủ — chỉ hiện khi có việc cần làm ngay. */
export function NoxhAttentionCard({ attention, onPress }: { attention: NonNullable<NoxhAttention>; onPress: () => void }) {
  const m = META[attention.kind];
  return (
    <Card variant="sunken" radius="xl" onPress={onPress} accessibilityLabel={`${m.label}: ${attention.title}`} style={{ backgroundColor: toneColors[m.tone].bg }}>
      <View style={styles.row}>
        <IconCircle name={m.icon} tone={m.tone} size="md" />
        <View style={styles.flex}>
          <Text variant="label" color={toneColors[m.tone].fg}>
            {m.label.toUpperCase()}
          </Text>
          <Text variant="bodyStrong" weight="semibold" color={semantic.text}>
            {attention.title}
          </Text>
        </View>
        <Icon name="chevronRight" size="sm" variant="bold" color={toneColors[m.tone].fg} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
});
