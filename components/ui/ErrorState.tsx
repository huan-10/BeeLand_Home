import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Không thể tải dữ liệu',
  message = 'Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.iconWrap}>
        <Icon name="cloud-offline-outline" size={32} color={colors.danger[500]} />
      </View>
      <Text variant="h3" align="center">
        {title}
      </Text>
      <Text variant="small" color={colors.gray[500]} align="center" style={styles.message}>
        {message}
      </Text>
      {onRetry ? (
        <Button title="Thử lại" leftIcon="refresh" variant="secondary" size="sm" onPress={onRetry} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.danger[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  message: { maxWidth: 320 },
  action: { marginTop: 12 },
});
