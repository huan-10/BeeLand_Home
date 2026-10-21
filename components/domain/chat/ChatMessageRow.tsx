import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Icon, IconCircle, Pressable, Text } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { isImageMime, type ChatRow } from '@/lib/chat';
import { borderWidth, colors, interactive, opacity, radius, semantic, shadows, sizes, spacing, toneColors } from '@/theme';
import type { ChatAttachment } from '@/types';

import { ChatAttachmentView } from './ChatAttachmentView';

type MessageRow = Extract<ChatRow, { type: 'message' }>;

export interface ChatMessageRowProps {
  row: MessageRow;
  onOpenAttachment: (a: ChatAttachment) => void;
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
}

/**
 * Một tin trong hội thoại (kiểu Messenger, bảng màu "Xanh trời"): tin của khách bên phải nền xanh đậm `action` chữ trắng;
 * tin nhân viên bên trái thẻ trắng bóng `soft`, tên ở tin đầu cụm, avatar chữ cái ở tin cuối cụm. Bo 20, góc phía người gửi
 * nhỏ lại giữa các tin cùng cụm. Giờ / trạng thái dưới tin cuối cụm; gửi lỗi → "Thử lại" · "Xoá".
 */
export const ChatMessageRow = memo(function ChatMessageRow({ row, onOpenAttachment, onRetry, onDiscard }: ChatMessageRowProps) {
  const { message: m, first, last, footer } = row;
  const mine = m.from === 'me';
  const images = m.recalled ? [] : m.attachments.filter((a) => isImageMime(a.mime));
  const files = m.recalled ? [] : m.attachments.filter((a) => !isImageMime(a.mime));
  const hasText = !!m.text && !m.recalled;
  const quote = !m.recalled ? m.replyTo : null;
  const corner = mine
    ? { borderTopRightRadius: first ? radius.xl : radius.sm, borderBottomRightRadius: last ? radius.xl : radius.sm }
    : { borderTopLeftRadius: first ? radius.xl : radius.sm, borderBottomLeftRadius: last ? radius.xl : radius.sm };
  const failed = m.status === 'failed';

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowStaff, first ? styles.gapCluster : styles.gapTight]}>
      {!mine ? (
        <View style={styles.avatarSlot}>{last ? <Avatar name={m.senderName ?? 'Chủ đầu tư'} size="sm" /> : null}</View>
      ) : null}
      <View style={[styles.col, mine ? styles.colMine : styles.colStaff]}>
        {!mine && first ? (
          <Text variant="label" color={semantic.textMuted} style={styles.sender} numberOfLines={1}>
            {m.senderName ? `${m.senderName} · Chủ đầu tư` : 'Chủ đầu tư'}
          </Text>
        ) : null}

        {m.kind === 'form_request' && !m.recalled ? (
          <View style={[styles.bubble, styles.staff, styles.formCard, corner]}>
            <IconCircle name="idCard" tone="info" size="sm" />
            <View style={styles.flex}>
              <Text variant="captionStrong">Chủ đầu tư đề nghị cập nhật thông tin liên hệ</Text>
              <Text variant="caption" color={semantic.textMuted}>
                {m.text || 'Vui lòng nhắn số điện thoại hoặc email để chúng tôi liên hệ lại.'}
              </Text>
            </View>
          </View>
        ) : m.recalled ? (
          <View style={[styles.bubble, styles.recalled, corner]}>
            <Text variant="caption" color={semantic.textMuted} style={styles.italic}>
              Tin nhắn đã được thu hồi
            </Text>
          </View>
        ) : (
          <>
            {images.length ? (
              <View style={[styles.images, mine && styles.imagesMine]}>
                {images.map((a) => (
                  <ChatAttachmentView key={a.id} attachment={a} mine={mine} compact={images.length > 1} onOpen={onOpenAttachment} />
                ))}
              </View>
            ) : null}
            {hasText || files.length || quote ? (
              <View style={[styles.bubble, mine ? styles.mine : styles.staff, corner, failed && styles.failedBubble]}>
                {quote ? (
                  // Trích dẫn tin được trả lời (web ReplyQuote): vạch dọc + tên + tối đa 2 dòng.
                  <View style={[styles.quote, mine ? styles.quoteMine : styles.quoteStaff]} accessibilityLabel={`Trả lời ${quote.senderName}: ${quote.text ?? 'tệp đính kèm'}`}>
                    <Text variant="label" color={mine ? semantic.textOnAction : semantic.textBrand} numberOfLines={1}>
                      {quote.senderName}
                    </Text>
                    <Text variant="caption" color={mine ? semantic.textOnAction : semantic.textMuted} numberOfLines={2}>
                      {quote.text || 'Tệp đính kèm'}
                    </Text>
                  </View>
                ) : null}
                {files.map((a) => (
                  <ChatAttachmentView key={a.id} attachment={a} mine={mine} onOpen={onOpenAttachment} />
                ))}
                {hasText ? (
                  <Text variant="body" color={mine ? semantic.textOnAction : semantic.text} selectable>
                    {m.text}
                    {m.editedAt ? (
                      <Text variant="caption" color={mine ? semantic.onInverseMuted : semantic.textMuted}>
                        {'  '}(đã sửa)
                      </Text>
                    ) : null}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        )}

        {failed ? (
          <View style={styles.failRow}>
            <Icon name="alertCircle" size="sm" color={toneColors.danger.fg} />
            <Text variant="caption" color={toneColors.danger.fg}>
              Chưa gửi được
            </Text>
            <SmallAction label="Thử lại" onPress={() => onRetry(m.id)} brand />
            <SmallAction label="Xoá" onPress={() => onDiscard(m.id)} />
          </View>
        ) : footer ? (
          <View style={[styles.footer, mine && styles.footerMine]}>
            {mine && m.status === 'sending' ? <Icon name="clock" size="xs" color={semantic.textMuted} /> : null}
            {mine && footer.endsWith('Đã xem') ? <Icon name="checkDouble" size="xs" color={semantic.textBrand} /> : null}
            <Text variant="label" color={semantic.textMuted} numeric>
              {footer}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

function SmallAction({ label, onPress, brand }: { label: string; onPress: () => void; brand?: boolean }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} tin nhắn`}
      style={({ pressed }) => [styles.action, interactive, (pressed || hovered) && styles.actionHover]}>
      <Text variant="captionStrong" color={brand ? semantic.textBrand : semantic.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  // Chừa lề phía đối diện (kiểu Messenger) để tin dài không lấp hết chiều ngang.
  rowMine: { justifyContent: 'flex-end', paddingLeft: spacing.xl },
  rowStaff: { justifyContent: 'flex-start', paddingRight: spacing.xl },
  gapCluster: { marginTop: spacing.ms },
  gapTight: { marginTop: spacing.xs },
  avatarSlot: { width: sizes.avatar.sm, marginBottom: spacing.ml },
  col: { flexShrink: 1, maxWidth: sizes.chat.bubbleMaxWidth, gap: spacing.xs },
  colMine: { alignItems: 'flex-end' },
  colStaff: { alignItems: 'flex-start' },
  sender: { paddingHorizontal: spacing.ms },
  flex: { flex: 1, gap: spacing.xs },
  bubble: { borderRadius: radius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + spacing.xs / 2, gap: spacing.sm, flexShrink: 1 },
  mine: { backgroundColor: semantic.action },
  staff: { backgroundColor: semantic.surface, ...shadows.soft },
  failedBubble: { opacity: opacity.pressed },
  quote: { borderLeftWidth: borderWidth.strong, paddingLeft: spacing.sm, paddingVertical: spacing.xs / 2, borderRadius: radius.xs },
  quoteMine: { borderLeftColor: semantic.onInverseAccent },
  quoteStaff: { borderLeftColor: semantic.focusRing, backgroundColor: semantic.surfaceMuted, paddingRight: spacing.sm },
  recalled: { backgroundColor: colors.transparent, borderWidth: borderWidth.hairline, borderColor: semantic.border },
  italic: { fontStyle: 'italic' },
  formCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.ms },
  images: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  imagesMine: { justifyContent: 'flex-end' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  footerMine: { justifyContent: 'flex-end' },
  failRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'flex-end' },
  action: { minHeight: sizes.touchTarget, minWidth: sizes.touchTarget, paddingHorizontal: spacing.sm, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  actionHover: { backgroundColor: semantic.surfaceSunken },
});
