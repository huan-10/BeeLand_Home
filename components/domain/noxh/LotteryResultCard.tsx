import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Platform, StyleSheet, View } from 'react-native';

import { Button, IconCircle, Text } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { radius, semantic, spacing } from '@/theme';
import type { NoxhSpinResult } from '@/types';

/** Kết quả một lượt bốc thăm (đặt trong thẻ khu bốc thăm — không lồng thẻ có bóng); khi hiện, focus chuyển tới tiêu đề (trình đọc màn hình đọc ngay). */
export function LotteryResultCard({ result, onCertificate }: { result: NoxhSpinResult; onCertificate: () => void }) {
  const titleRef = useRef<View>(null);
  const won = result.ket_qua === 'TRUNG';

  useEffect(() => {
    const node = titleRef.current;
    if (!node) return;
    if (Platform.OS === 'web') (node as unknown as { focus?: () => void }).focus?.();
    else {
      const handle = findNodeHandle(node);
      if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
    }
  }, []);

  const unit = result.can;
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <IconCircle name={won ? 'confetti' : 'info'} tone={won ? 'success' : 'neutral'} size="hero" />
        <View ref={titleRef} accessible accessibilityRole="header" tabIndex={-1}>
          <Text variant="title" align="center">
            {won ? `Chúc mừng! Bạn đã trúng căn ${unit?.ky_hieu ?? ''}` : 'Rất tiếc, bạn chưa trúng'}
          </Text>
        </View>
        {!won ? (
          <Text variant="subhead" color={semantic.textBrand} align="center">
            Bạn là dự phòng số {result.thu_tu_du_phong ?? '—'}
          </Text>
        ) : null}
      </View>
      {won && unit ? (
        <View style={styles.grid}>
          <Cell label="Tòa" value={unit.toa ?? '—'} />
          <Cell label="Tầng" value={unit.tang ?? '—'} />
          <Cell label="Diện tích" value={unit.dien_tich != null ? `${unit.dien_tich.toString().replace('.', ',')} m²` : '—'} />
          <Cell label="Phòng ngủ" value={unit.so_pn != null ? String(unit.so_pn) : '—'} />
        </View>
      ) : null}
      <Text variant="caption" color={semantic.textMuted} align="center" style={styles.note}>
        {won
          ? 'Chủ đầu tư sẽ liên hệ hướng dẫn thanh toán và ký hợp đồng.'
          : 'Nếu có căn trống, chủ đầu tư sẽ liên hệ theo thứ tự dự phòng.'}{' '}
        Mở lúc {formatDateTime(result.mo_luc)}.
      </Text>
      <Button title="Xem giấy xác nhận" variant="outline" leftIcon="document" fullWidth onPress={onCertificate} />
    </View>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text variant="caption" color={semantic.textMuted}>
        {label}
      </Text>
      <Text variant="subhead" numeric>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: spacing.sm },
  head: { alignItems: 'center', gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  cell: { flexGrow: 1, flexBasis: '40%', gap: spacing.xs, padding: spacing.ms, borderRadius: radius.lg, backgroundColor: semantic.surfaceMuted },
  note: { marginVertical: spacing.md },
});
