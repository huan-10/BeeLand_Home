import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Icon, IconCircle, Pressable, Skeleton, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { isImageMime } from '@/lib/chat';
import { formatFileSize } from '@/lib/noxh';
import { getChatFileUrl } from '@/services';
import { colors, interactive, opacity, radius, semantic, sizes, spacing } from '@/theme';
import type { ChatAttachment } from '@/types';

export interface ChatAttachmentViewProps {
  attachment: ChatAttachment;
  mine: boolean;
  /** Nhiều ảnh trong một tin → ô nhỏ hơn, xếp lưới. */
  compact?: boolean;
  onOpen: (attachment: ChatAttachment) => void;
}

/** Ảnh: xem trước trong khung bo góc (link ký 5 phút, xin khi hiện); tài liệu: dòng icon + tên + dung lượng. Bấm → mở. */
export function ChatAttachmentView({ attachment, mine, compact, onOpen }: ChatAttachmentViewProps) {
  return isImageMime(attachment.mime) ? (
    <ChatImage attachment={attachment} compact={compact} onOpen={onOpen} />
  ) : (
    <ChatFile attachment={attachment} mine={mine} onOpen={onOpen} />
  );
}

function ChatImage({ attachment, compact, onOpen }: Omit<ChatAttachmentViewProps, 'mine'>) {
  const [uri, setUri] = useState<string | null>(attachment.localUri ?? null);
  const [failed, setFailed] = useState(false);
  const { hovered, hoverProps } = useHover();

  useEffect(() => {
    if (attachment.localUri || attachment.id.startsWith('local-')) return;
    let alive = true;
    getChatFileUrl(attachment.id)
      .then((u) => alive && (u ? setUri(u) : setFailed(true)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [attachment.id, attachment.localUri]);

  const w = compact ? sizes.chat.imageSmall : sizes.chat.image;
  const ratio = attachment.width && attachment.height ? attachment.height / attachment.width : 3 / 4;
  const h = Math.round(Math.min(Math.max(w * ratio, w * 0.5), w * 1.4));

  return (
    <Pressable
      {...hoverProps}
      onPress={() => onOpen(attachment)}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Xem ảnh ${attachment.name}`}
      style={({ pressed }) => [styles.imageBox, { width: w, height: h }, interactive, (pressed || hovered) && styles.pressed]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors onError={() => setFailed(true)} />
      ) : failed ? (
        <View style={styles.imageFallback}>
          <Icon name="image" size="lg" color={semantic.iconMuted} />
        </View>
      ) : (
        <Skeleton width={w} height={h} radius={radius.lg} />
      )}
    </Pressable>
  );
}

function ChatFile({ attachment, mine, onOpen }: Omit<ChatAttachmentViewProps, 'compact'>) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      {...hoverProps}
      onPress={() => onOpen(attachment)}
      accessibilityRole="button"
      accessibilityLabel={`Mở tệp ${attachment.name}`}
      style={({ pressed }) => [styles.file, mine ? styles.fileMine : styles.fileStaff, interactive, (pressed || hovered) && styles.pressed]}>
      <IconCircle name={attachment.mime === 'application/pdf' ? 'filePdf' : 'document'} tone="primary" size="sm" />
      <View style={styles.fileText}>
        <Text variant="captionStrong" color={semantic.text} numberOfLines={1}>
          {attachment.name}
        </Text>
        {attachment.size > 0 ? (
          <Text variant="label" color={semantic.textMuted}>
            {formatFileSize(attachment.size)}
          </Text>
        ) : null}
      </View>
      <Icon name="download" size="sm" color={semantic.textBrand} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  imageBox: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: semantic.surfaceSunken },
  image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: opacity.pressed },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.touchTarget + spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    maxWidth: sizes.chat.bubbleMaxWidth,
  },
  // Tài liệu trong bong bóng xanh của khách: nền trắng để chữ / icon đọc rõ.
  fileMine: { backgroundColor: colors.white },
  fileStaff: { backgroundColor: semantic.surfaceMuted },
  fileText: { flexShrink: 1, minWidth: 0 },
});
