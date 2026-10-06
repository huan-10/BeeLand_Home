import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout';
import { Button, Card, ErrorState, IconCircle, KeyValueRow, SkeletonCard, Text } from '@/components/ui';
import { useNoxhApplication } from '@/hooks/useNoxh';
import { formatDate } from '@/lib/format';
import { layout, semantic, spacing, type IconName } from '@/theme';

const NEXT: { icon: IconName; title: string; text: string }[] = [
  { icon: 'shieldCheck', title: 'Chủ đầu tư kiểm tra', text: 'Hồ sơ được kiểm tra từng giấy tờ; nếu cần bổ sung, bạn sẽ thấy ghi chú trong hồ sơ.' },
  { icon: 'building', title: 'Gửi Sở Xây dựng', text: 'Hồ sơ đủ điều kiện được gửi Sở Xây dựng chấp thuận.' },
  { icon: 'trophy', title: 'Bốc thăm', text: 'Hồ sơ được chấp thuận sẽ được xếp lịch bốc thăm online.' },
];

/** Nộp hồ sơ thành công. */
export default function SubmittedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: d, loading, error, refetch } = useNoxhApplication(id);

  return (
    <Screen>
      <View style={styles.wrap}>
        {loading ? (
          <SkeletonCard lines={5} />
        ) : error || !d ? (
          <Card>
            <ErrorState message={error ?? undefined} onRetry={() => void refetch()} />
          </Card>
        ) : (
          <>
            <View style={styles.hero} accessible accessibilityRole="header" accessibilityLabel={`Đã nộp hồ sơ ${d.so_ho_so}`}>
              <IconCircle name="checkCircle" tone="success" size="hero" />
              <Text variant="title" align="center">
                Đã nộp hồ sơ
              </Text>
              <Text variant="body" color={semantic.textSecondary} align="center">
                Hồ sơ của bạn đã được gửi tới {d.dot?.ten ?? d.ten_du_an}. Chúng tôi sẽ báo khi có kết quả kiểm tra.
              </Text>
            </View>
            <Card padding="sm">
              <KeyValueRow label="Số hồ sơ" value={d.so_ho_so} numeric copyable />
              <KeyValueRow label="Dự án" value={d.ten_du_an ?? '—'} />
              <KeyValueRow label="Ngày nộp" value={formatDate(d.ngay_tiep_nhan)} numeric last />
            </Card>
            <Card padding="ml">
              <Text variant="heading" accessibilityRole="header">
                Các bước tiếp theo
              </Text>
              <View style={styles.next} role="list">
                {NEXT.map((n, i) => (
                  <View key={n.title} style={styles.nextRow} role="listitem">
                    <IconCircle name={n.icon} tone="primary" size="md" />
                    <View style={styles.flex}>
                      <Text variant="bodyStrong" weight="semibold">
                        {i + 1}. {n.title}
                      </Text>
                      <Text variant="caption" color={semantic.textMuted}>
                        {n.text}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
            <View style={styles.actions}>
              <Button title="Xem hồ sơ" fullWidth onPress={() => router.replace({ pathname: '/noxh/ho-so/[id]', params: { id: d.id } })} />
              <Button title="Về trang Nhà ở xã hội" variant="ghost" fullWidth onPress={() => router.navigate('/noxh')} />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: layout.readableMaxWidth, alignSelf: 'center', gap: spacing.ml },
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  next: { gap: spacing.ms, marginTop: spacing.md },
  nextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  actions: { gap: spacing.sm },
});
