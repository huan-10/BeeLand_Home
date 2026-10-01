import { useEffect, useRef, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { interactive, radius, semantic, shadows, sizes, spacing } from '@/theme';

import { useHover } from '@/hooks/useHover';

import { Text } from './Text';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  /** Số lượng hiển thị cạnh nhãn, ví dụ "Phiếu thu (2)". */
  count?: number;
}

export interface TabsProps<K extends string> {
  /** Tiền tố id duy nhất trên màn hình (dùng nối tab ↔ panel). */
  id: string;
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel: string;
}

export const tabId = (id: string, key: string) => `${id}-tab-${key}`;
export const panelId = (id: string, key: string) => `${id}-panel-${key}`;

/**
 * Tab chuyển nội dung dạng thanh phân đoạn: nền cát, tab đang chọn là viên trắng nổi, chữ đậm.
 * WAI-ARIA Tabs: `role="tablist"` / `role="tab"` + `aria-selected`.
 * Web: roving tabindex (chỉ tab đang chọn nhận Tab), ←/→ chuyển tab, Home/End về đầu/cuối.
 */
export function Tabs<K extends string>({ id, items, value, onChange, accessibilityLabel }: TabsProps<K>) {
  const listRef = useRef<View>(null);
  const itemsRef = useRef(items);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    itemsRef.current = items;
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = listRef.current as unknown as HTMLElement | null;
    if (!node) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const list = itemsRef.current;
      const index = list.findIndex((t) => t.key === valueRef.current);
      const target =
        e.key === 'ArrowRight' ? (index + 1) % list.length
        : e.key === 'ArrowLeft' ? (index - 1 + list.length) % list.length
        : e.key === 'Home' ? 0
        : e.key === 'End' ? list.length - 1
        : -1;
      if (target < 0) return;
      e.preventDefault();
      const next = list[target];
      if (!next) return;
      onChangeRef.current(next.key);
      document.getElementById(tabId(id, next.key))?.focus();
    };
    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [id]);

  return (
    <View ref={listRef} style={styles.list} role="tablist" aria-label={accessibilityLabel}>
      {items.map((t) => {
        const selected = t.key === value;
        const label = t.count === undefined ? t.label : `${t.label} (${t.count})`;
        return <TabButton key={t.key} id={id} tabKey={t.key} label={label} selected={selected} onPress={() => onChange(t.key)} />;
      })}
    </View>
  );
}

function TabButton({ id, tabKey, label, selected, onPress }: { id: string; tabKey: string; label: string; selected: boolean; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      nativeID={tabId(id, tabKey)}
      role="tab"
      aria-selected={selected}
      accessibilityLabel={label}
      tabIndex={selected ? 0 : -1}
      onPress={onPress}
      {...hoverProps}
      style={({ pressed }) => [styles.tab, interactive, selected && styles.selected, (pressed || hovered) && (selected ? styles.selectedHover : styles.pressed)]}>
      <Text variant="captionStrong" weight={selected ? 'bold' : 'medium'} color={selected ? semantic.text : semantic.textMuted} align="center">
        {label}
      </Text>
    </Pressable>
  );
}

/** Vùng nội dung của một tab; `aria-labelledby` trỏ về tab tương ứng. */
export function TabPanel({ id, tabKey, children }: { id: string; tabKey: string; children: ReactNode }) {
  return (
    // tabIndex 0: panel nhận được focus bằng Tab kể cả khi bên trong không có phần tử tương tác (WAI-ARIA Tabs).
    <View nativeID={panelId(id, tabKey)} role="tabpanel" aria-labelledby={tabId(id, tabKey)} tabIndex={0} style={styles.panel}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: 'row', padding: spacing.xs, gap: spacing.xs, borderRadius: radius.full, backgroundColor: semantic.surfaceSunken },
  tab: {
    flex: 1,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  selected: { backgroundColor: semantic.surface, ...shadows.soft },
  selectedHover: shadows.raised,
  pressed: { backgroundColor: semantic.border },
  panel: { gap: spacing.ms, paddingTop: spacing.md },
});
