import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { ChatComposer, ChatDayDivider, ChatIntro, ChatMessageRow, type ChatComposerHandle } from '@/components/domain';
import { Screen } from '@/components/layout';
import { Card, ErrorState, ScreenHeader, Skeleton, Text, useToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { chatRows, type ChatRow } from '@/lib/chat';
import { openDocument } from '@/lib/openDocument';
import { getChatFileUrl, getErrorMessage } from '@/services';
import { radius, semantic, sizes, spacing } from '@/theme';
import type { ChatAttachment } from '@/types';

/**
 * Nhắn tin với chủ đầu tư (kênh `app` của BeeChat trên web): danh sách tin kiểu Messenger (mới nhất ở đáy, kéo lên tải tin
 * cũ), ô soạn dính đáy, realtime. Mọi nhân viên có quyền BeeChat của công ty đang xem thấy và trả lời trên web.
 * Mobile: ẩn thanh tab nổi để ô soạn sát đáy (`navItems.TAB_BAR_HIDDEN`).
 */
export default function ChatScreen() {
  const toast = useToast();
  const { companies, activeCompanyId } = useAuth();
  const companyName = companies.find((c) => c.companyId === activeCompanyId)?.companyName ?? null;
  const chat = useChat();
  const composer = useRef<ChatComposerHandle>(null);
  const [opening, setOpening] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // FlatList đảo ngược: phần tử đầu nằm ở đáy → đưa dòng mới nhất lên đầu mảng.
  const rows = useMemo(() => chatRows(chat.messages, chat.staffReadAt).reverse(), [chat.messages, chat.staffReadAt]);

  const openAttachment = useCallback(
    async (a: ChatAttachment) => {
      if (opening) return;
      setOpening(true);
      try {
        const url = a.id.startsWith('local-') ? '' : await getChatFileUrl(a.id);
        if (url) await openDocument(url, a.name);
        else toast.show(a.id.startsWith('local-') ? 'Tệp đang được gửi' : 'Bản xem thử chưa có tệp thật để mở', 'info');
      } catch (e) {
        toast.show(getErrorMessage(e), 'danger');
      } finally {
        setOpening(false);
      }
    },
    [opening, toast],
  );

  const retry = useCallback(
    async (id: string) => {
      const err = await chat.retry(id);
      if (err) toast.show(err, 'danger');
    },
    [chat, toast],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatRow }) =>
      item.type === 'day' ? (
        <ChatDayDivider label={item.label} />
      ) : (
        <ChatMessageRow row={item} onOpenAttachment={(a) => void openAttachment(a)} onRetry={(id) => void retry(id)} onDiscard={chat.discard} />
      ),
    [chat.discard, openAttachment, retry],
  );

  const intro = (
    <View style={styles.introWrap}>
      {chat.loadingOlder ? <ActivityIndicator color={semantic.brand} style={styles.older} accessibilityLabel="Đang tải tin cũ" /> : null}
      {!chat.hasMore ? (
        <ChatIntro companyName={companyName} showSuggestions={chat.messages.length === 0} onSuggest={(t) => composer.current?.fill(t)} />
      ) : null}
    </View>
  );

  let body;
  if (chat.loading) {
    body = (
      <View style={styles.skeleton} accessibilityLabel="Đang tải tin nhắn">
        <Skeleton width="62%" height={sizes.skeleton.row} radius={radius.xl} />
        <Skeleton width="48%" height={sizes.skeleton.row} radius={radius.xl} style={styles.skelMine} />
        <Skeleton width="70%" height={sizes.skeleton.row} radius={radius.xl} />
      </View>
    );
  } else if (chat.error && chat.messages.length === 0) {
    body = (
      <Card style={styles.errorCard}>
        <ErrorState message={chat.error} onRetry={() => void chat.reload()} />
      </Card>
    );
  } else {
    body = (
      <FlatList
        inverted
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={renderItem}
        ListFooterComponent={intro}
        onEndReached={() => void chat.loadOlder()}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.flex}
        accessibilityLabel="Tin nhắn"
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      <Screen
        scroll={false}
        footer={
          <View>
            {chat.staffTyping ? (
              <View style={styles.typing} accessibilityLiveRegion="polite">
                <View style={styles.typingDots}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
                <Text variant="caption" color={semantic.textMuted}>
                  Chủ đầu tư đang soạn tin…
                </Text>
              </View>
            ) : null}
            <ChatComposer ref={composer} onSend={chat.send} progress={chat.progress} onTyping={chat.notifyTyping} />
          </View>
        }>
        <ScreenHeader title="Nhắn tin" subtitle={companyName ? `${companyName} · Chăm sóc khách hàng` : 'Chăm sóc khách hàng'} onBack={back} />
        <View style={styles.thread}>{body}</View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  thread: { flex: 1, width: '100%', maxWidth: sizes.chat.contentMaxWidth, alignSelf: 'center' },
  list: { paddingVertical: spacing.sm },
  introWrap: { gap: spacing.ms },
  older: { marginTop: spacing.sm },
  skeleton: { gap: spacing.ms, paddingTop: spacing.md },
  skelMine: { alignSelf: 'flex-end' },
  errorCard: { marginTop: spacing.md },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: sizes.chat.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.ml,
    paddingBottom: spacing.sm,
  },
  typingDots: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.ms, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: semantic.surface },
  dot: { width: sizes.dot.md, height: sizes.dot.md, borderRadius: radius.full, backgroundColor: semantic.iconMuted },
});
