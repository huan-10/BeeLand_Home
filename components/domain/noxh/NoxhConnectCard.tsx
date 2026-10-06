import { StyleSheet, View } from 'react-native';

import { Button, Card, IconCircle, Text } from '@/components/ui';
import { semantic, spacing } from '@/theme';

/** Phiên chưa có token NOXH → mời kết nối (nhập mật khẩu hiện tại). */
export function NoxhConnectCard({ onPress }: { onPress: () => void }) {
  return (
    <Card padding="ml" radius="3xl">
      <View style={styles.row}>
        <IconCircle name="shieldCheck" tone="primary" size="xl" />
        <View style={styles.text}>
          <Text variant="heading" accessibilityRole="header">
            Kết nối tài khoản Nhà ở xã hội
          </Text>
          <Text variant="caption" color={semantic.textMuted}>
            Dùng mật khẩu đăng nhập hiện tại để xem hồ sơ, nộp giấy tờ và tham gia bốc thăm.
          </Text>
        </View>
      </View>
      <Button title="Kết nối ngay" leftIcon="key" onPress={onPress} style={styles.button} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms },
  text: { flex: 1, minWidth: 0, gap: spacing.xs },
  button: { marginTop: spacing.md },
});
