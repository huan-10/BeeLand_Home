import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { handoverSteps } from '@/lib/handover';
import type { HandoverStatus } from '@/types';
import { borderWidth, colors, semantic, sizes, spacing, toneColors } from '@/theme';

import { StepNode, stepStateLabel } from '../noxh/StepNode';

/**
 * 4 bước bàn giao nằm ngang (Chuẩn bị · Đã thông báo · Đang bàn giao · Đã nhận nhà): nút tròn + đường nối + nhãn dưới.
 * Một tên truy cập cho cả thanh ("Bước 3/4: Đang bàn giao").
 */
export function HandoverStepper({ status }: { status: HandoverStatus }) {
  const steps = handoverSteps(status);
  const currentIndex = steps.findIndex((s) => s.state === 'current');
  const label =
    currentIndex >= 0
      ? `Tiến trình bàn giao: bước ${currentIndex + 1}/${steps.length}, ${steps[currentIndex]?.label}`
      : `Tiến trình bàn giao: ${steps[steps.length - 1]?.label}, ${stepStateLabel.done}`;
  return (
    <View style={styles.row} accessible accessibilityRole="progressbar" accessibilityLabel={label}>
      {steps.map((s, i) => (
        <View key={s.label} style={styles.step}>
          <View style={styles.nodeRow}>
            <View style={[styles.line, steps[i - 1]?.state === 'done' && s.state !== 'todo' && styles.lineDone, i === 0 && styles.hidden]} />
            <StepNode state={s.state} index={i} />
            <View style={[styles.line, s.state === 'done' && styles.lineDone, i === steps.length - 1 && styles.hidden]} />
          </View>
          <Text
            variant="label"
            align="center"
            weight={s.state === 'current' ? 'bold' : 'medium'}
            color={s.state === 'todo' ? semantic.textMuted : semantic.text}
            style={styles.label}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  nodeRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  line: { flex: 1, height: borderWidth.strong, backgroundColor: colors.gray[200] },
  lineDone: { backgroundColor: toneColors.success.solid },
  hidden: { backgroundColor: 'transparent' },
  label: { letterSpacing: 0, paddingHorizontal: spacing.xs / 2, minHeight: sizes.timelineNode },
});
