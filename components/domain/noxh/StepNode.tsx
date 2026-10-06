import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import type { StepState } from '@/lib/noxh';
import { borderWidth, colors, radius, semantic, sizes, toneColors } from '@/theme';

/** Chữ đi kèm trạng thái bước — màu không phải tín hiệu duy nhất. */
export const stepStateLabel: Record<StepState, string> = { done: 'Đã xong', current: 'Đang thực hiện', todo: 'Chưa tới' };

/** Nút tròn của một bước: xong = xanh lá + dấu tích · đang làm = xanh đậm + số · chưa tới = viền xám + số. */
export function StepNode({ state, index }: { state: StepState; index: number }) {
  const done = state === 'done';
  const current = state === 'current';
  const bg = done ? toneColors.success.solid : current ? semantic.action : semantic.surface;
  return (
    <View style={[styles.node, { backgroundColor: bg, borderColor: done || current ? bg : colors.gray[300] }]}>
      {done ? (
        <Icon name="check" size="sm" variant="bold" color={toneColors.success.onSolid} />
      ) : (
        <Text variant="label" color={current ? semantic.textOnAction : semantic.textMuted} numeric>
          {index + 1}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    width: sizes.timelineNode,
    height: sizes.timelineNode,
    borderRadius: radius.full,
    borderWidth: borderWidth.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
