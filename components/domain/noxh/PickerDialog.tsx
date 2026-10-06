import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Dialog, EmptyState, Icon, Input, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { interactive, radius, semantic, sizes, spacing } from '@/theme';

export interface PickerItem {
  value: string;
  label: string;
}

export interface PickerDialogProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  value?: string;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
}

/** Hộp thoại chọn một mục có ô tìm kiếm (tỉnh / phường-xã…); hàng ≥ 44, mục đang chọn có dấu tích. */
export function PickerDialog({ visible, title, items, value, onSelect, onClose }: PickerDialogProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('vi');
    return q ? items.filter((i) => i.label.toLocaleLowerCase('vi').includes(q)) : items;
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
  return (
    <View role="listitem">
      <Pressable
        {...hoverProps}
        onPress={onPress}
        accessibilityRole="button"
        aria-selected={selected}
        accessibilityLabel={selected ? `${item.label}, đang chọn` : item.label}
        style={({ pressed }) => [styles.row, interactive, (pressed || hovered) && styles.hover, selected && styles.selected]}>
        <Text variant="body" weight={selected ? 'semibold' : 'regular'} color={selected ? semantic.textBrand : semantic.text} style={styles.flex}>
          {item.label}
        </Text>
        {selected ? <Icon name="check" size="sm" variant="bold" color={semantic.textBrand} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: sizes.pickerList },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: sizes.touchTarget, paddingHorizontal: spacing.ms, borderRadius: radius.xl },
  hover: { backgroundColor: semantic.surfaceMuted },
  selected: { backgroundColor: semantic.focusHalo },
  flex: { flex: 1, minWidth: 0 },
});
