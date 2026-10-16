import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import type { dateStrip } from '@/lib/handover';
import { interactive, opacity, radius, semantic, shadows, sizes, spacing, toneColors } from '@/theme';

type StripDay = ReturnType<typeof dateStrip>[number];

export interface DateStripProps {
  days: StripDay[];
  selected: string | null;
  onSelect: (date: string) => void;
}

const STEP = sizes.scheduleDate + spacing.sm;

/** Dải ngày vuốt ngang (thứ · ngày · tháng): ngày còn chỗ có chấm xanh, ngày kín mờ + "Kín" và không bấm được. */
export function DateStrip({ days, selected, onSelect }: DateStripProps) {
  const ref = useRef<ScrollView>(null);
  const scrolled = useRef(false);
  // Lần đầu có ngày chọn sẵn (vd đổi lịch sang ngày xa) → cuộn tới ngày đó.
  useEffect(() => {
    if (scrolled.current || !selected) return;
    const i = days.findIndex((d) => d.date === selected);
    if (i > 1) ref.current?.scrollTo({ x: (i - 1) * STEP, animated: false });
    scrolled.current = true;
  }, [days, selected]);

  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Chọn ngày nhận nhà">
      {days.map((d) => (
        <DayChip key={d.date} day={d} selected={d.date === selected} onPress={() => onSelect(d.date)} />
      ))}
    </ScrollView>
  );
}

function DayChip({ day: d, selected, onPress }: { day: StripDay; selected: boolean; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  const fg = selected ? semantic.onInverse : semantic.text;
  const sub = selected ? semantic.onInverse : semantic.textMuted;
  return (
    <Pressable
      onPress={d.available ? onPress : undefined}
      disabled={!d.available}
      accessibilityRole="radio"
      aria-checked={selected}
      aria-disabled={!d.available}
      accessibilityLabel={`${d.weekday} ${Number(d.day)} tháng ${d.month.replace('Th', '')}, ${d.available ? 'còn chỗ' : 'đã kín'}`}
      {...hoverProps}
      style={({ pressed }) => [
        styles.chip,
        d.available && interactive,
        selected ? styles.selected : d.available ? styles.idle : styles.full,
        hovered && d.available && (selected ? styles.selectedHover : styles.idleHover),
        pressed && styles.pressed,
      ]}>
      <Text variant="label" color={sub} numberOfLines={1}>
        {d.weekday}
      </Text>
      <Text variant="title" numeric color={fg}>
        {d.day}
      </Text>
      <Text variant="label" color={sub}>
        {d.month}
      </Text>
      {d.available ? (
        <View style={[styles.dot, { backgroundColor: selected ? semantic.onInverse : toneColors.success.solid }]} />
      ) : (
        <Text variant="label" color={semantic.textMuted}>
          Kín
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  chip: { width: sizes.scheduleDate, alignItems: 'center', gap: spacing.xs / 2, paddingVertical: spacing.sm, borderRadius: radius.xl },
  idle: { backgroundColor: semantic.surface, ...shadows.soft },
  idleHover: { backgroundColor: semantic.surfaceSunken },
  selected: { backgroundColor: semantic.inverse },
  selectedHover: { backgroundColor: semantic.inverseHover },
  full: { backgroundColor: semantic.surfaceMuted, opacity: opacity.disabled },
  pressed: { opacity: opacity.pressed },
  dot: { width: sizes.dot.md, height: sizes.dot.md, borderRadius: radius.full, marginVertical: spacing.xs / 2 },
});
