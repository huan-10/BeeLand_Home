import { StyleSheet, View } from 'react-native';

import { Icon, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import type { StepState } from '@/lib/noxh';
import { interactive, radius, semantic, sizes, spacing } from '@/theme';

import { StepNode, stepStateLabel } from './StepNode';

export interface StepListItem {
  label: string;
  state: StepState;
  /** Dòng phụ (ví dụ "Còn thiếu 2 giấy tờ"). */
  hint?: string;
  onPress?: () => void;
}

/** Danh sách bước của hồ sơ (Thông tin cá nhân · Thành phần hồ sơ · Xác minh · Đủ điều kiện). */
export function StepList({ steps }: { steps: StepListItem[] }) {
  return (
    <View role="list" aria-label="Các bước hồ sơ" style={styles.list}>
      {steps.map((s, i) => (
        <StepRow key={s.label} step={s} index={i} total={steps.length} />
      ))}
    </View>
  );
}

function StepRow({ step, index, total }: { step: StepListItem; index: number; total: number }) {
  const { hovered, hoverProps } = useHover();
  const a11y = `Bước ${index + 1}/${total}: ${step.label}, ${stepStateLabel[step.state]}${step.hint ? `, ${step.hint}` : ''}`;
  const body = (
    <>
      <StepNode state={step.state} index={index} />
      <View style={styles.text}>
        <Text variant="bodyStrong" weight="semibold" color={step.state === 'todo' ? semantic.textMuted : semantic.text}>
          {step.label}
        </Text>
        <Text variant="caption" color={step.state === 'current' ? semantic.textBrand : semantic.textMuted}>
          {step.hint ?? stepStateLabel[step.state]}
        </Text>
      </View>
      {step.onPress ? <Icon name="chevronRight" size="sm" variant="bold" color={semantic.iconMuted} /> : null}
    </>
  );
  if (!step.onPress) {
    return (
      <View role="listitem" accessible accessibilityLabel={a11y} style={styles.row}>
        {body}
      </View>
    );
  }
  return (
    <View role="listitem">
      <Pressable
        {...hoverProps}
        onPress={step.onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({ pressed }) => [styles.row, styles.pressable, interactive, (pressed || hovered) && styles.hover]}>
        {body}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, minHeight: sizes.touchTarget, paddingVertical: spacing.sm },
  pressable: { paddingHorizontal: spacing.sm, marginHorizontal: -spacing.sm, borderRadius: radius.xl },
  hover: { backgroundColor: semantic.surfaceMuted },
  text: { flex: 1, minWidth: 0, gap: spacing.xs },
});
