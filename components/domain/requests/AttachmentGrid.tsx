import { Image, StyleSheet, View } from 'react-native';

import { Icon, Pressable, Text } from '@/components/ui';
import { formatFileSize } from '@/lib/noxh';
import type { PickedFile } from '@/services';
import { borderWidth, colors, interactive, opacity, radius, semantic, sizes, spacing, toneColors } from '@/theme';

const isImage = (f: PickedFile) => /^image\//i.test(f.type ?? '') || /\.(jpe?g|png|webp)$/i.test(f.name);
const ext = (name: string) => (name.split('.').pop() ?? '').toUpperCase();

export interface AttachmentGridProps {
  files: PickedFile[];
  max: number;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/**
 * Lưới tệp đính kèm (như mẫu "Ảnh đính kèm"): ô "Thêm" viền nét đứt (ẩn khi đủ `max`), ảnh hiện thu nhỏ, tài liệu hiện
 * icon + đuôi + dung lượng; nút xoá tròn góc trên. Ô vuông `sizes.attachThumb`, bo `xl`.
 */
export function AttachmentGrid({ files, max, disabled, onAdd, onRemove }: AttachmentGridProps) {
  return (
    <View style={styles.grid}>
      {files.length < max ? (
        <Pressable
          onPress={onAdd}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Thêm ảnh hoặc tệp, đã có ${files.length}/${max}`}
          style={({ pressed }) => [styles.tile, styles.add, interactive, pressed && styles.pressed]}>
          <Icon name="camera" color={semantic.textBrand} />
          <Text variant="label" weight="medium" color={semantic.textBrand} style={styles.addText}>
            Thêm
          </Text>
        </Pressable>
      ) : null}
      {files.map((f, i) => (
        <View key={`${f.uri}-${i}`} style={styles.tile} accessible accessibilityLabel={`${f.name}, ${formatFileSize(f.size)}`}>
          {isImage(f) ? (
            <Image source={{ uri: f.uri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.doc}>
              <Icon name="document" color={semantic.textBrand} />
              <Text variant="label" weight="bold" color={semantic.textBrand} numberOfLines={1} style={styles.addText}>
                {ext(f.name)}
              </Text>
              <Text variant="label" color={semantic.textMuted} numberOfLines={1} style={styles.addText}>
                {formatFileSize(f.size)}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => onRemove(i)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Bỏ ${f.name}`}
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.remove, interactive, pressed && styles.pressed]}>
            <Icon name="close" size="xs" color={colors.white} strong />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: sizes.attachThumb, height: sizes.attachThumb, borderRadius: radius.xl, backgroundColor: semantic.surfaceSunken },
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: borderWidth.thick,
    borderStyle: 'dashed',
    borderColor: colors.primary[200],
    backgroundColor: toneColors.primary.bg,
  },
  addText: { letterSpacing: 0 },
  image: { width: '100%', height: '100%', borderRadius: radius.xl },
  doc: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs / 2, paddingHorizontal: spacing.xs },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: sizes.icon.lg,
    height: sizes.icon.lg,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay.scrim,
  },
  pressed: { opacity: opacity.pressed },
});
