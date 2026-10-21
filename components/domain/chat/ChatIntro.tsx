import { StyleSheet, View } from 'react-native';

import { Card, Chip, IconCircle, Text } from '@/components/ui';
import { CHAT_SUGGESTIONS } from '@/lib/chat';
import { radius, semantic, spacing } from '@/theme';

export interface ChatIntroProps {
  companyName: string | null;
  /** Chưa có tin nào → hiện câu gợi ý mở lời. */
  showSuggestions: boolean;
  onSuggest: (text: string) => void;
}

/** Thẻ đầu hội thoại: ai sẽ trả lời + hỏi được gì; khi chưa có tin, kèm chip câu gợi ý (bấm → điền vào ô soạn). */
export function ChatIntro({ companyName, showSuggestions, onSuggest }: ChatIntroProps) {
  return (
    <Card style={styles.card}>
      <IconCircle name="headset" tone="primary" size="hero" />
      <View style={styles.text}>
        <Text variant="heading" align="center" accessibilityRole="header">
          Nhắn tin với chủ đầu tư
        </Text>
        <Text variant="caption" color={semantic.textMuted} align="center">
          Hỏi về hợp đồng, thanh toán, bàn giao hay hồ sơ nhà ở xã hội — bộ phận chăm sóc khách hàng
          {companyName ? ` của ${companyName}` : ''} sẽ trả lời bạn ngay tại đây.
        </Text>
      </View>
      {showSuggestions ? (
        <View style={styles.chips} accessibilityLabel="Câu hỏi gợi ý">
          {CHAT_SUGGESTIONS.map((q) => (
            <Chip key={q} label={q} size="sm" onPress={() => onSuggest(q)} accessibilityLabel={`Dùng câu gợi ý: ${q}`} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

/** Vạch ngày giữa hội thoại: viên thuốc nền lõm căn giữa ("Hôm nay", "Hôm qua", "Thứ Hai, 12/10/2026"). */
export function ChatDayDivider({ label }: { label: string }) {
  return (
    <View style={styles.dayWrap} accessibilityRole="header">
      <View style={styles.day}>
        <Text variant="label" color={semantic.textMuted}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.ms, paddingVertical: spacing.lg, marginTop: spacing.sm },
  text: { gap: spacing.xs, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs },
  dayWrap: { alignItems: 'center', marginTop: spacing.ml, marginBottom: spacing.xs },
  day: { backgroundColor: semantic.surfaceSunken, borderRadius: radius.full, paddingHorizontal: spacing.ms, paddingVertical: spacing.xs },
});
