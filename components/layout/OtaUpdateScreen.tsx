import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { formatUpdatingClock } from '@/lib/otaUpdate';
import { colors, fontSizes, layout, letterSpacing, radius, sizes, spacing, zIndex } from '@/theme';

const logoMark = require('@/assets/images/logo.png');
const ota = colors.ota;

/**
 * Màn "Beeland Plus đang cập nhật dữ liệu mới" khi có bản OTA (hooks/useOtaUpdate).
 * Phủ toàn màn, chặn thao tác — không cho bỏ qua; tải xong app tự reload sang bản mới.
 * Giống hệt phương án D "Navy cao cấp" của app admin (beeland-app_2026/components/OtaUpdateScreen.tsx),
 * chỉ khác tên + logo (người dùng chốt 2026-10-21) — nên dùng nhóm màu riêng `colors.ota`, không theo bảng xanh trời.
 */
export function OtaUpdateScreen({ percent }: { percent: number | null }) {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const clock = formatUpdatingClock(now);

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <View style={[styles.content, { paddingTop: insets.top + spacing.xl + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.brand}>
          <Image source={logoMark} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
          <View>
            <Text variant="heading" weight="bold" color={ota.text} accessibilityRole="header">
              Beeland Plus
            </Text>
            <Text variant="caption" color={ota.muted}>
              Cập nhật phiên bản
            </Text>
          </View>
        </View>

        <View style={styles.clockBlock}>
          <Text
            weight="bold"
            color={ota.text}
            numeric
            style={[fontSizes.clock, { letterSpacing: letterSpacing.clock }]}
            accessibilityLabel={`${clock.time}, ${clock.date}`}>
            {clock.time}
          </Text>
          <Text variant="heading" weight="medium" color={ota.muted} importantForAccessibility="no">
            {clock.date}
          </Text>
          <View style={styles.accentBar} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardTexts}>
            <Text variant="heading" color={ota.text} accessibilityLiveRegion="polite">
              Beeland Plus đang cập nhật dữ liệu mới
            </Text>
            <Text variant="caption" color={ota.muted}>
              Xin vui lòng chờ ...
            </Text>
          </View>
          <View style={styles.progressRow}>
            <Text variant="caption" color={ota.muted}>
              {percent == null ? 'Đang kết nối máy chủ…' : 'Đang tải bản cập nhật'}
            </Text>
            <Text variant="title" color={ota.accent} numeric>
              {percent == null ? '…' : `${percent}%`}
            </Text>
          </View>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityLabel="Tiến độ tải bản cập nhật"
            accessibilityValue={{ min: 0, max: 100, now: percent ?? 0 }}>
            <View style={[styles.fill, { width: `${percent ?? 0}%` }]} />
          </View>
        </View>

        <Text variant="caption" color={ota.muted} align="center" style={styles.footer}>
          Ứng dụng sẽ tự mở lại khi cập nhật xong
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: zIndex.system, elevation: zIndex.system, backgroundColor: ota.bg },
  content: { flex: 1, width: '100%', maxWidth: layout.formMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  logo: { width: sizes.logo.xl, height: sizes.logo.xl, borderRadius: radius.md, backgroundColor: colors.white },
  clockBlock: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  accentBar: { width: sizes.logo.xl, height: sizes.dot.sm - spacing.xs / 2, borderRadius: radius.full, backgroundColor: ota.accent, marginTop: spacing.md },
  card: { gap: spacing.md, padding: spacing.ml, borderRadius: radius['3xl'], backgroundColor: ota.surface },
  cardTexts: { gap: spacing.xs },
  progressRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  track: { height: sizes.progress.sm, borderRadius: radius.full, overflow: 'hidden', backgroundColor: ota.track },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: ota.accent },
  footer: { marginTop: spacing.md },
});
