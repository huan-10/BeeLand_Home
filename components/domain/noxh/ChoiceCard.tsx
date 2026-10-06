import { StyleSheet, View } from 'react-native';

import { Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { borderWidth, colors, interactive, radius, semantic, shadows, sizes, spacing } from '@/theme';

export interface ChoiceCardProps {
  title: string;
  description?: string | null;
  selected: boolean;
  onPress: () => void;
}

/**
 * Thẻ chọn một (radio) — dùng trong `role="radiogroup"`.
 * Thường: thẻ trắng bóng `soft` · Đang chọn: nền `primary.50` viền `action`, không bóng (không viền + bóng cùng lúc).
 */
export function ChoiceCard({ title, description, selected, onPress }: ChoiceCardProps) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      role="radio"
      aria-checked={selected}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={({ pressed }) => [
        styles.card,
        interactive,
        selected ? styles.selected : styles.idle,
        !selected && (pressed || hovered) && styles.hover,
      ]}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={styles.text}>
        <Text variant="bodyStrong" weight="semibold">
          {title}
        </Text>
        {description ? (
          <Text variant="caption" color={semantic.textMuted}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.ms,
    padding: spacing.md,
    minHeight: sizes.control.lg,
    borderRadius: radius.xl,
    borderWidth: borderWidth.strong,
  },
  idle: { backgroundColor: semantic.surface, borderColor: colors.transparent, ...shadows.soft },
  hover: { backgroundColor: semantic.surfaceMuted },
  selected: { backgroundColor: colors.primary[50], borderColor: semantic.action },
  radio: {
    width: sizes.checkbox,
    height: sizes.checkbox,
    borderRadius: radius.full,
    borderWidth: borderWidth.strong,
    borderColor: semantic.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: semantic.action },
  radioDot: { width: sizes.dot.md + spacing.xs, height: sizes.dot.md + spacing.xs, borderRadius: radius.full, backgroundColor: semantic.action },
  text: { flex: 1, minWidth: 0, gap: spacing.xs },
});
