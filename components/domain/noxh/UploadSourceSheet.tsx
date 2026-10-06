import { StyleSheet, View } from 'react-native';

import { Dialog, Icon, IconCircle, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import type { PickSource } from '@/services';
import { interactive, radius, semantic, sizes, spacing, type IconName } from '@/theme';

const META: Record<PickSource, { icon: IconName; label: string; hint: string }> = {
  camera: { icon: 'camera', label: 'Chụp ảnh', hint: 'Đặt giấy tờ trên nền phẳng, đủ sáng, rõ 4 góc' },
  library: { icon: 'image', label: 'Chọn ảnh có sẵn', hint: 'Ảnh JPG hoặc PNG trong máy' },
  document: { icon: 'document', label: 'Chọn tệp', hint: 'Tệp PDF, JPG, PNG…' },
};

export interface UploadSourceSheetProps {
  visible: boolean;
  title: string;
  sources: PickSource[];
  onPick: (source: PickSource) => void;
  onClose: () => void;
}

/** Hộp chọn nguồn tải giấy tờ: chụp ảnh · thư viện ảnh · tệp. */
export function UploadSourceSheet({ visible, title, sources, onPick, onClose }: UploadSourceSheetProps) {
  return (
    <Dialog visible={visible} title={title} onClose={onClose}>
      <View style={styles.list}>
        {sources.map((s) => (
          <SourceRow key={s} source={s} onPress={() => onPick(s)} />
        ))}
      </View>
    </Dialog>
  );
}

function SourceRow({ source, onPress }: { source: PickSource; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  const m = META[source];
  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${m.label}. ${m.hint}`}
      style={({ pressed }) => [styles.row, interactive, (pressed || hovered) && styles.hover]}>
      <IconCircle name={m.icon} tone="primary" size="md" />
      <View style={styles.flex}>
        <Text variant="bodyStrong" weight="semibold">
          {m.label}
        </Text>
        <Text variant="caption" color={semantic.textMuted}>
          {m.hint}
        </Text>
      </View>
      <Icon name="chevronRight" size="sm" variant="bold" color={semantic.iconMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, minHeight: sizes.control.lg, padding: spacing.sm, borderRadius: radius.xl },
  hover: { backgroundColor: semantic.surfaceMuted },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
});
