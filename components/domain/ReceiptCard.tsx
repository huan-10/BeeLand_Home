import { StyleSheet, View } from 'react-native';

import { Card, Icon, IconCircle, Text } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { paymentMethodLabels } from '@/lib/labels';
import { colors } from '@/theme';
import type { Receipt } from '@/types';

export function ReceiptCard({ receipt, onPress }: { receipt: Receipt; onPress?: () => void }) {
  return (
    <Card onPress={onPress} accessibilityLabel={`Phiếu thu ${receipt.code}`}>
      <View style={styles.row}>
        <IconCircle name="receipt" tone="success" />
        <View style={styles.main}>
          <Text variant="bodyMedium" weight="semibold">
            {receipt.code}
          </Text>
          <Text variant="caption" color={colors.gray[500]} numberOfLines={1}>
            {receipt.contractCode} · {formatDate(receipt.paidDate)} · {paymentMethodLabels[receipt.method]}
          </Text>
        </View>
        <View style={styles.right}>
          <Text variant="smallMedium" weight="semibold" color={colors.success[700]}>
            +{formatCurrency(receipt.amount)}
          </Text>
          {onPress ? <Icon name="chevron-forward" size={16} color={colors.gray[400]} /> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  main: { flex: 1, gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
