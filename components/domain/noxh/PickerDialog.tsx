import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Dialog, EmptyState, Icon, Input, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { interactive, radius, semantic, sizes, spacing } from '@/theme';

export interface PickerItem {
  value: string;
  label: string;
  /** Dòng phụ nhỏ, nhạt (VD "Dự án · Số phiếu"); có thì hàng thành 2 dòng, mỗi dòng 1 hàng chữ + "…". */
  description?: string;
}

export interface PickerDialogProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  value?: string;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
}

/** Hộp thoại chọn một mục có ô tìm kiếm (tỉnh / phường-xã…, tìm cả dòng phụ); hàng ≥ 44, mục đang chọn có dấu tích. */
export function PickerDialog({ visible, title, items, value, onSelect, onClose }: PickerDialogProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('vi');
    return q ? items.filter((i) => `${i.label} ${i.description ?? ''}`.toLocaleLowerCase('vi').includes(q)) : items;
  }, [items, query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Dialog visible={visible} title={title} onClose={close}>
      <Input icon="search" placeholder="Tìm kiếm" accessibilityLabel={`Tìm ${title.toLocaleLowerCase('vi')}`} value={query} onChangeText={setQuery} autoCorrect={false} />
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" role="list">
        {filtered.length === 0 ? (
          <EmptyState icon="search" title="Không tìm thấy" description="Thử từ khoá khác." />
        ) : (
          filtered.map((item) => (
            <Row
              key={item.value}
              item={item}
              selected={item.value === value}
              onPress={() => {
                setQuery('');
                onSelect(item);
              }}
            />
          ))
        )}
      </ScrollView>
    </Dialog>
  );
}

function Row({ item, selected, onPress }: { item: PickerItem; selected: boolean; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  const name = item.description ? `${item.label}, ${item.description}` : item.label;
  return (
    <View role="listitem">
      <Pressable
        {...hoverProps}
        onPress={onPress}
        accessibilityRole="button"
        aria-selected={selected}
        accessibilityLabel={selected ? `${name}, đang chọn` : name}
        style={({ pressed }) => [styles.row, item.description && styles.rowTwoLine, interactive, (pressed || hovered) && styles.hover, selected && styles.selected]}>
        {item.description ? (
          <View style={styles.flex}>
            <Text variant="body" weight="semibold" color={selected ? semantic.textBrand : semantic.text} numberOfLines={1}>
              {item.label}
            </Text>
            <Text variant="caption" color={semantic.textMuted} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
        ) : (
          <Text variant="body" weight={selected ? 'semibold' : 'regular'} color={selected ? semantic.textBrand : semantic.text} style={styles.flex}>
            {item.label}
          </Text>
        )}
        {selected ? <Icon name="check" size="sm" variant="bold" color={semantic.textBrand} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: sizes.pickerList },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: sizes.touchTarget, paddingHorizontal: spacing.ms, borderRadius: radius.xl },
  rowTwoLine: { paddingVertical: spacing.sm, marginBottom: spacing.xs },
  hover: { backgroundColor: semantic.surfaceMuted },
  selected: { backgroundColor: semantic.focusHalo },
  flex: { flex: 1, minWidth: 0 },
});
