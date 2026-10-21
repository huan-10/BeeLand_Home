import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UploadSourceSheet } from '@/components/domain/noxh';
import { Icon, IconButton, Pressable, Text, useToast } from '@/components/ui';
import { useHover } from '@/hooks/useHover';
import { CHAT_FILE_FORMATS, CHAT_FILES_MAX, CHAT_TEXT_MAX, CHAT_TEXT_WARN, chatTextError, isImageMime } from '@/lib/chat';
import { checkChatFile, getErrorMessage, pickFile, pickSources, type PickSource, type PickedFile } from '@/services';
import {
  borderWidth,
  colors,
  fontSizes,
  interactive,
  layout,
  opacity,
  radius,
  resolveFontFamily,
  semantic,
  shadows,
  sizes,
  spacing,
} from '@/theme';

export interface ChatComposerHandle {
  /** Điền câu gợi ý vào ô soạn (không gửi ngay — khách sửa rồi gửi). */
  fill: (text: string) => void;
}

export interface ChatComposerProps {
  /** Trả lỗi (tiếng Việt) nếu không gửi được; null = đã gửi / đang chờ trong danh sách. */
  onSend: (text: string, files: PickedFile[]) => Promise<string | null>;
  /** Đang tải tệp của tin trước (i/n). */
  progress: { done: number; total: number } | null;
  /** Khách đang gõ → báo nhân viên ("Khách đang gõ…" trên web / app nhân viên). */
  onTyping?: () => void;
}

/**
 * Ô soạn tin dính đáy (thẻ trắng bo đỉnh 28 như `StickyActionBar`): nút đính kèm · ô nhập viên thuốc nền lõm (tự giãn tới
 * `sizes.chat.composerMaxHeight`) · nút gửi tròn xanh đậm. Tệp chờ gửi hiện thành hàng thẻ nhỏ phía trên (bỏ được từng tệp).
 * Web: Enter gửi, Shift+Enter xuống dòng.
 */
export const ChatComposer = forwardRef<ChatComposerHandle, ChatComposerProps>(function ChatComposer({ onSend, progress, onTyping }, ref) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [picking, setPicking] = useState(false);
  const [focused, setFocused] = useState(false);
  /** Web: chiều cao nội dung textarea (native TextInput nhiều dòng tự giãn). */
  const [webHeight, setWebHeight] = useState<number | null>(null);
  const input = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    fill: (t: string) => {
      setText(t);
      input.current?.focus();
    },
  }));

  const canSend = !chatTextError(text, files.length) && !progress;

  const submit = async () => {
    const err = chatTextError(text, files.length);
    if (err) {
      if (text.trim() || files.length) toast.show(err, 'danger');
      return;
    }
    const t = text;
    const f = files;
    setText('');
    setFiles([]);
    setWebHeight(null);
    const sendErr = await onSend(t, f);
    if (sendErr) toast.show(sendErr, 'danger');
  };

  const addFrom = async (source: PickSource) => {
    setPicking(false);
    try {
      const file = await pickFile(source, CHAT_FILE_FORMATS);
      if (!file) return;
      const bad = checkChatFile(file);
      if (bad) return toast.show(`${file.name}: ${bad}`, 'danger');
      setFiles((cur) => (cur.length >= CHAT_FILES_MAX ? cur : [...cur, file]));
    } catch (e) {
      toast.show(getErrorMessage(e), 'danger');
    }
  };

  const attach = () => {
    if (files.length >= CHAT_FILES_MAX) return toast.show(`Tối đa ${CHAT_FILES_MAX} tệp mỗi lần gửi`, 'info');
    // Web: trình duyệt chỉ mở hộp chọn tệp khi gọi ngay trong thao tác bấm.
    if (pickSources.length === 1 && pickSources[0]) void addFrom(pickSources[0]);
    else setPicking(true);
  };

  const over = text.length > CHAT_TEXT_WARN;

  return (
    <View style={[styles.bar, shadows.raisedTop, { paddingBottom: Math.max(insets.bottom, spacing.ms) }]}>
      <View style={styles.inner}>
        {progress ? (
          <Text variant="label" color={semantic.textMuted} style={styles.status} accessibilityLiveRegion="polite">
            Đang tải tệp {progress.done + 1}/{progress.total}…
          </Text>
        ) : null}
        {files.length ? (
          <View style={styles.files} accessibilityLabel={`${files.length} tệp chờ gửi`}>
            {files.map((f, i) => (
              <View key={`${f.name}-${i}`} style={styles.fileChip}>
                {isImageMime(f.type) ? (
                  <Image source={{ uri: f.uri }} style={styles.thumb} accessibilityIgnoresInvertColors />
                ) : (
                  <View style={[styles.thumb, styles.thumbDoc]}>
                    <Icon name="document" size="sm" color={semantic.textBrand} />
                  </View>
                )}
                <Text variant="caption" numberOfLines={1} style={styles.fileName}>
                  {f.name}
                </Text>
                <IconButton
                  icon="close"
                  variant="plain"
                  accessibilityLabel={`Bỏ tệp ${f.name}`}
                  onPress={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                />
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.row}>
          <IconButton icon="attach" variant="plain" accessibilityLabel="Đính kèm ảnh hoặc tệp" onPress={attach} />
          <View style={[styles.field, focused && styles.fieldFocused]}>
            <TextInput
              ref={input}
              value={text}
              onChangeText={(v) => {
                setText(v);
                if (v.trim()) onTyping?.();
              }}
              placeholder="Nhập tin nhắn…"
              placeholderTextColor={semantic.placeholder}
              multiline
              // Web: <textarea> mặc định 2 hàng → 1 hàng (numberOfLines = rows); native tự giãn, Android không khoá số dòng.
              {...(Platform.OS === 'web' ? { numberOfLines: 1 } : null)}
              maxLength={CHAT_TEXT_MAX}
              accessibilityLabel="Nội dung tin nhắn"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyPress={(e) => {
                // Web: Enter gửi, Shift+Enter xuống dòng.
                const ev = e.nativeEvent as { key: string; shiftKey?: boolean };
                if (Platform.OS === 'web' && ev.key === 'Enter' && !ev.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              onContentSizeChange={(e) => {
                if (Platform.OS === 'web') setWebHeight(e.nativeEvent.contentSize.height);
              }}
              style={[styles.input, webHeight != null && { height: Math.min(webHeight, sizes.chat.composerMaxHeight) }]}
            />
          </View>
          <SendButton disabled={!canSend} onPress={() => void submit()} />
        </View>
        {over ? (
          <Text variant="label" color={semantic.textMuted} align="right" numeric>
            {text.length}/{CHAT_TEXT_MAX}
          </Text>
        ) : null}
      </View>
      <UploadSourceSheet
        visible={picking}
        title="Gửi ảnh hoặc tệp"
        sources={pickSources}
        onPick={(s) => void addFrom(s)}
        onClose={() => setPicking(false)}
      />
    </View>
  );
});

function SendButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const { hovered, hoverProps } = useHover();
  return (
    <Pressable
      {...hoverProps}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Gửi tin nhắn"
      aria-disabled={disabled}
      style={({ pressed }) => [
        styles.send,
        interactive,
        hovered && !disabled && styles.sendHover,
        pressed && !disabled && styles.sendPressed,
        disabled && styles.sendDisabled,
      ]}>
      <Icon name="send" size="md" variant="fill" color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: semantic.surface,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingTop: spacing.ms,
    paddingHorizontal: spacing.ms,
  },
  inner: { width: '100%', maxWidth: sizes.chat.contentMaxWidth, alignSelf: 'center', gap: spacing.sm },
  status: { paddingHorizontal: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  field: {
    flex: 1,
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: borderWidth.thick,
    borderColor: semantic.surfaceSunken,
    backgroundColor: semantic.surfaceSunken,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: { backgroundColor: semantic.surface, borderColor: semantic.focusRing },
  input: {
    maxHeight: sizes.chat.composerMaxHeight,
    paddingVertical: spacing.sm + spacing.xs / 2,
    color: semantic.text,
    fontFamily: resolveFontFamily('regular'),
    ...fontSizes.body,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  send: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.full,
    backgroundColor: semantic.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendHover: { backgroundColor: semantic.actionHover },
  sendPressed: { backgroundColor: semantic.actionPressed },
  sendDisabled: { opacity: opacity.disabled },
  files: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: layout.contentMaxWidth / 4,
    paddingLeft: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: semantic.surfaceMuted,
  },
  thumb: { width: sizes.iconBox.md, height: sizes.iconBox.md, borderRadius: radius.md },
  thumbDoc: { backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  fileName: { flexShrink: 1 },
});
