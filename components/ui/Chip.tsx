import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
}

/** Nút lọc dạng viên thuốc. */
export function Chip({ label, selected, onPress, count }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected ? styles.selected : styles.idle, pressed && styles.pressed]}>
      <Text variant="smallMedium" color={selected ? colors.white : colors.gray[700]}>
        {count !== undefined ? `${label} (${count})` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  idle: { backgroundColor: colors.white, borderColor: colors.gray[200] },
  selected: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  pressed: { opacity: 0.8 },
});
