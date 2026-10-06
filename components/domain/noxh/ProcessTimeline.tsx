import { StyleSheet, View } from 'react-native';

import { Icon, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import type { ProcessStep } from '@/lib/noxh';
import { borderWidth, colors, interactive, radius, semantic, spacing, toneColors } from '@/theme';

import { StepNode, stepStateLabel } from './StepNode';

/** Timeline "Quá trình xử lý" 5 chặng; chặng bấm được (bốc thăm) có mũi tên. */
export function ProcessTimeline({ steps, onPressStep }: { steps: ProcessStep[]; onPressStep?: (key: ProcessStep['key']) => void }) {
  return (
    <View role="list" aria-label="Quá trình xử lý hồ sơ">
      {steps.map((s, i) => (
        <TimelineItem key={s.key} step={s} index={i} last={i === steps.length - 1} onPress={onPressStep ? () => onPressStep(s.key) : undefined} />
      ))}
    </View>
  );
}

function TimelineItem({ step, index, last, onPress }: { step: ProcessStep; index: number; last: boolean; onPress?: () => void }) {
  const { hovered, hoverProps } = useHover();
  const a11y = `${step.label}, ${stepStateLabel[step.state]}${step.detail ? `, ${step.detail}` : ''}`;
  const content = (
    <View style={[styles.content, !last && styles.contentGap]}>
      <View style={styles.titleRow}>
        <Text variant="bodyStrong" weight="semibold" color={step.state === 'todo' ? semantic.textMuted : semantic.text} style={styles.flex}>
          {step.label}
        </Text>
        {onPress ? <Icon name="chevronRight" size="sm" variant="bold" color={semantic.iconMuted} /> : null}
      </View>
      <Text variant="caption" color={step.state === 'current' ? semantic.textBrand : semantic.textMuted}>
        {step.detail ?? stepStateLabel[step.state]}
      </Text>
    </View>
  );
  return (
    <View style={styles.item} role="listitem">
      <View style={styles.rail}>
        <StepNode state={step.state} index={index} />
        {!last ? <View style={[styles.line, step.state === 'done' && styles.lineDone]} /> : null}
      </View>
      {onPress ? (
        <Pressable
          {...hoverProps}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={a11y}
          style={({ pressed }) => [styles.press, interactive, (pressed || hovered) && styles.hover]}>
          {content}
        </Pressable>
      ) : (
        <View style={styles.flex} accessible accessibilityLabel={a11y}>
          {content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.ms },
  rail: { alignItems: 'center' },
  line: { flex: 1, width: borderWidth.strong, backgroundColor: colors.gray[200], marginVertical: spacing.xs },
  lineDone: { backgroundColor: toneColors.success.solid },
  flex: { flex: 1, minWidth: 0 },
  press: { flex: 1, minWidth: 0, borderRadius: radius.xl, paddingHorizontal: spacing.sm, marginHorizontal: -spacing.sm },
  hover: { backgroundColor: semantic.surfaceMuted },
  content: { gap: spacing.xs, paddingTop: spacing.xs },
  contentGap: { paddingBottom: spacing.ml },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
