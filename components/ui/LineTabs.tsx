import { StyleSheet, View } from 'react-native';

import { useHover } from '@/hooks/useHover';
import { borderWidth, interactive, opacity, semantic, sizes, spacing } from '@/theme';

import { Pressable } from './Pressable';
import { tabId } from './Tabs';
import { Text } from './Text';

export interface LineTabItem<K extends string> {
  key: K;
  label: string;
  count?: number;
}

export interface LineTabsProps<K extends string> {
  items: LineTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel: string;
  /** Có `TabPanel` đi kèm → truyền cùng id để panel `aria-labelledby` trỏ đúng tab. */
  id?: string;
}

/**
 * Tab gạch chân gọn (lọc trạng thái trong một màn): chữ đậm + vạch thương hiệu dưới tab đang chọn,
 * đường kẻ mảnh suốt hàng. Khác `Tabs` (thanh phân đoạn chuyển màn) để hai tầng không trông giống nhau.
 */
export function LineTabs<K extends string>({ items, value, onChange, accessibilityLabel, id }: LineTabsProps<K>) {
  return (
    <View style={styles.row} role="tablist" aria-label={accessibilityLabel}>
      {items.map((t) => (
        <LineTab key={t.key} nativeID={id ? tabId(id, t.key) : undefined} item={t} selected={t.key === value} onPress={() => onChange(t.key)} />
      ))}
    </View>
  );
}

function LineTab<K extends string>({ item, selected, onPress, nativeID }: { item: LineTabItem<K>; selected: boolean; onPress: () => void; nativeID?: string }) {
  const { hovered, hoverProps } = useHover();
  const label = item.count === undefined ? item.label : `${item.label} (${item.count})`;
  return (
    <Pressable
      nativeID={nativeID}
      role="tab"
      aria-selected={selected}
      accessibilityLabel={label}
      onPress={onPress}
      {...hoverProps}
      style={({ pressed }) => [styles.tab, interactive, (pressed || hovered) && !selected && styles.pressed]}>
      <Text variant="bodyStrong" weight={selected ? 'bold' : 'medium'} color={selected ? semantic.text : semantic.textMuted} numberOfLines={1}>
        {item.label}
        {item.count !== undefined ? (
          <Text variant="bodyStrong" weight="medium" color={selected ? semantic.textBrand : semantic.textMuted} numeric>
            {` ${item.count}`}
          </Text>
        ) : null}
      </Text>
      <View style={[styles.bar, selected && styles.barOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: borderWidth.hairline, borderBottomColor: semantic.border },
  // Rộng theo nội dung rồi chia phần dư: nhãn dài ("Lịch thanh toán") không bị cắt khi đứng cạnh nhãn ngắn.
  tab: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minHeight: sizes.touchTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  bar: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: -borderWidth.hairline, height: borderWidth.strong + 1, borderRadius: borderWidth.strong },
  barOn: { backgroundColor: semantic.brand },
  pressed: { opacity: opacity.pressed },
});
