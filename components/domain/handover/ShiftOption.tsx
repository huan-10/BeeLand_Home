import { StyleSheet, View } from 'react-native';

import { Badge, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import type { HandoverShift } from '@/types';
import { borderWidth, interactive, opacity, radius, semantic, shadows, sizes, spacing, toneColors } from '@/theme';

export interface ShiftOptionProps {
  shift: HandoverShift;
  selected: boolean;
  onPress: () => void;
}

/** Một ca nhận nhà (nút chọn một): tên · giờ · "Còn n chỗ"; ca kín bị khoá. */
export function ShiftOption({ shift: s, selected, onPress }: ShiftOptionProps) {
  const { hovered, hoverProps } = useHover();
  const full = s.remaining <= 0;
  const time = s.to ? `${s.from} – ${s.to}` : s.from;
  return (
    <Pressable
      onPress={full ? undefined : onPress}
      disabled={full}
      accessibilityRole="radio"
      aria-checked={selected}
      aria-disabled={full}
      accessibilityLabel={`${s.name}, ${time}, ${full ? 'đã kín' : `còn ${s.remaining} chỗ`}`}
      {...hoverProps}
      style={({ pressed }) => [
        styles.row,
        !full && interactive,
        selected ? styles.selected : full ? styles.full : styles.idle,
        hovered && !full && !selected && styles.idleHover,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={styles.main}>
        <Text variant="bodyStrong" weight="semibold" numeric>
          {time}
        </Text>
        {s.name ? (
          <Text variant="caption" color={semantic.textSecondary}>
            {s.name}
          </Text>
        ) : null}
      </View>
      <Badge label={full ? 'Kín' : `Còn ${s.remaining} chỗ`} tone={full ? 'neutral' : 'success'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.control.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: borderWidth.strong,
    borderColor: 'transparent',
  },
  idle: { backgroundColor: semantic.surface, ...shadows.soft },
  idleHover: { backgroundColor: semantic.surfaceSunken },
  selected: { backgroundColor: toneColors.primary.bg, borderColor: semantic.action },
  full: { backgroundColor: semantic.surfaceMuted, opacity: opacity.disabled },
  pressed: { opacity: opacity.pressed },
  main: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
  radio: {
    width: sizes.icon.md,
    height: sizes.icon.md,
    borderRadius: radius.full,
    borderWidth: borderWidth.strong,
    borderColor: semantic.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: semantic.action },
  radioDot: { width: sizes.dot.md, height: sizes.dot.md, borderRadius: radius.full, backgroundColor: semantic.action },
});
