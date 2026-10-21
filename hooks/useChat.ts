import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { CHAT_TYPING_GAP_MS, CHAT_TYPING_SHOW_MS, latestServerTime, mergeMessages, newClientId } from '@/lib/chat';
import {
  getChatThread,
  getErrorMessage,
  markChatRead,
  sendChatMessage,
  subscribeChat,
  uploadChatFile,
  type PickedFile,
} from '@/services';
import type { ChatAttachment, ChatMessage } from '@/types';

/** Realtime chưa nối được (mạng chặn websocket…) → làm mới định kỳ khi đang mở màn. */
const POLL_MS = 15_000;
const PAGE = 50;

interface Pending {
  text: string;
  files: PickedFile[];
  /** Tệp đã tải lên ở lần thử trước (không tải lại). */
  uploaded: ChatAttachment[];
}

export interface ChatState {
  messages: ChatMessage[];
  staffReadAt: string | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadingOlder: boolean;
  /** Đang gửi tin (đang tải tệp i/n). */
  progress: { done: number; total: number } | null;
  reload: () => Promise<void>;
  loadOlder: () => Promise<void>;
  /** Gửi tin; trả lỗi (tiếng Việt) nếu không gửi được — tin vẫn nằm trong danh sách để "Thử lại". */
  send: (text: string, files: PickedFile[]) => Promise<string | null>;
  retry: (id: string) => Promise<string | null>;
  discard: (id: string) => void;
  /** Nhân viên đang soạn tin (tín hiệu `typing` from 'agent', ẩn sau 4 s). */
  staffTyping: boolean;
  /** Khách đang gõ → báo nhân viên (tối đa 1 lần / 3 s). */
  notifyTyping: () => void;
}

/**
 * Hội thoại "Nhắn tin với chủ đầu tư": tải tin, gửi lạc quan (tin hiện ngay, lỗi → "Thử lại"), nghe realtime
 * `chatv:<key>` (tín hiệu → tải tin mới), dự phòng làm mới 15 s khi realtime không nối, đánh dấu đã đọc khi màn đang mở.
 */
export function useChat(): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [staffReadAt, setStaffReadAt] = useState<string | null>(null);
  const [channelKey, setChannelKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [focused, setFocused] = useState(false);
  const [live, setLive] = useState(false);
  const [staffTyping, setStaffTyping] = useState(false);
  const channel = useRef<{ typing: () => void } | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const pending = useRef(new Map<string, Pending>());
  const mounted = useRef(true);
  const lastRead = useRef<string | null>(null);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const apply = useCallback((incoming: ChatMessage[], meta: { staffReadAt: string | null; channelKey: string | null }) => {
    if (!mounted.current) return;
    setMessages((cur) => mergeMessages(cur, incoming));
    setStaffReadAt(meta.staffReadAt);
    if (meta.channelKey) setChannelKey(meta.channelKey);
  }, []);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const t = await getChatThread({ limit: PAGE });
      if (!mounted.current) return;
      // Giữ tin đang gửi / lỗi của khách khi tải lại.
      setMessages((cur) => mergeMessages(cur.filter((m) => m.status !== 'sent'), t.messages));
      setStaffReadAt(t.staffReadAt);
      setChannelKey(t.channelKey);
      setHasMore(t.hasMore);
    } catch (e) {
      if (mounted.current) setError(getErrorMessage(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  /** Tin mới sau tin máy chủ cuối cùng (chưa có tin → tải trang đầu). */
  const fetchNew = useCallback(async () => {
    const after = latestServerTime(messagesRef.current);
    if (!after) return reload();
    try {
      const t = await getChatThread({ after, limit: PAGE });
      apply(t.messages, t);
    } catch {
      /* lỗi mạng khi làm mới ngầm → lần sau thử lại */
    }
  }, [apply, reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Realtime: tín hiệu `new` / `read` → lấy tin mới; `updated` (thu hồi / sửa) → tải lại trang mới nhất;
  // `typing` (nhân viên đang soạn) → hiện "đang soạn tin" 4 s; tin mới đến thì tắt ngay.
  useEffect(() => {
    if (!channelKey) return;
    const ch = subscribeChat(
      channelKey,
      (t) => {
        if (t === 'typing') {
          setStaffTyping(true);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => mounted.current && setStaffTyping(false), CHAT_TYPING_SHOW_MS);
          return;
        }
        if (t === 'new') setStaffTyping(false);
        void (t === 'updated' ? reload() : fetchNew());
      },
      (ok) => {
        if (!mounted.current) return;
        setLive((was) => {
          if (ok && !was) void fetchNew(); // vừa nối (lại) → tải bù
          return ok;
        });
      },
    );
    channel.current = ch;
    return () => {
      ch.close();
      channel.current = null;
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [channelKey, fetchNew, reload]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (!channel.current || now - lastTypingSent.current < CHAT_TYPING_GAP_MS) return;
    lastTypingSent.current = now;
    channel.current.typing();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      void fetchNew();
      return () => setFocused(false);
    }, [fetchNew]),
  );

  // Dự phòng khi realtime chưa nối + quay lại app từ nền.
  useEffect(() => {
    if (!focused) return;
    const timer = live ? null : setInterval(() => void fetchNew(), POLL_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void fetchNew();
    });
    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [focused, live, fetchNew]);

  // Đang mở màn và có tin nhân viên mới → báo đã đọc (nhân viên thấy "Đã xem").
  useEffect(() => {
    if (!focused) return;
    const lastStaff = [...messages].reverse().find((m) => m.from === 'staff');
    if (!lastStaff || lastRead.current === lastStaff.id) return;
    lastRead.current = lastStaff.id;
    void markChatRead().catch(() => {
      lastRead.current = null;
    });
  }, [focused, messages]);

  const loadOlder = useCallback(async () => {
    const oldest = messagesRef.current.find((m) => m.status === 'sent');
    if (!oldest || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    try {
      const t = await getChatThread({ before: oldest.createdAt, limit: PAGE });
      if (!mounted.current) return;
      setMessages((cur) => mergeMessages(cur, t.messages));
      setHasMore(t.hasMore);
    } catch {
      /* giữ nguyên, khách cuộn lại để thử */
    } finally {
      if (mounted.current) setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder]);

  const deliver = useCallback(
    async (clientId: string): Promise<string | null> => {
      const job = pending.current.get(clientId);
      if (!job) return null;
      const localId = `local-${clientId}`;
      setMessages((cur) => cur.map((m) => (m.id === localId ? { ...m, status: 'sending' } : m)));
      try {
        const todo = job.files.slice(job.uploaded.length);
        for (const f of todo) {
          setProgress({ done: job.uploaded.length, total: job.files.length });
          job.uploaded.push(await uploadChatFile(f));
        }
        setProgress(null);
        const sent = await sendChatMessage(
          clientId,
          job.text,
          job.uploaded.map((a) => a.id),
        );
        pending.current.delete(clientId);
        // Ảnh vừa gửi: giữ bản xem trước cục bộ (khỏi xin link ký ngay).
        const withLocal = {
          ...sent,
          attachments: sent.attachments.map((a) => ({ ...a, localUri: job.uploaded.find((u) => u.id === a.id)?.localUri })),
        };
        if (mounted.current) setMessages((cur) => mergeMessages(cur, [withLocal]));
        // Tin đầu tiên tạo hội thoại → lấy channel_key để bật realtime.
        if (!channelKey) void fetchNew();
        return null;
      } catch (e) {
        setProgress(null);
        if (mounted.current) setMessages((cur) => cur.map((m) => (m.id === localId ? { ...m, status: 'failed' } : m)));
        return getErrorMessage(e);
      }
    },
    [channelKey, fetchNew],
  );

  const send = useCallback(
    async (text: string, files: PickedFile[]) => {
      const clientId = newClientId();
      pending.current.set(clientId, { text, files, uploaded: [] });
      const local: ChatMessage = {
        id: `local-${clientId}`,
        clientId,
        from: 'me',
        senderName: null,
        senderAvatar: null,
        kind: files.length ? 'file' : 'text',
        text: text.trim() || null,
        replyTo: null,
        attachments: files.map((f, i) => ({ id: `local-${clientId}-${i}`, name: f.name, mime: f.type ?? '', size: f.size, width: null, height: null, localUri: f.uri })),
        createdAt: new Date().toISOString(),
        editedAt: null,
        recalled: false,
        status: 'sending',
      };
      setMessages((cur) => mergeMessages(cur, [local]));
      return deliver(clientId);
    },
    [deliver],
  );

  const retry = useCallback(
    (id: string) => {
      const m = messagesRef.current.find((x) => x.id === id);
      return m?.clientId ? deliver(m.clientId) : Promise.resolve(null);
    },
    [deliver],
  );

  const discard = useCallback((id: string) => {
    const m = messagesRef.current.find((x) => x.id === id);
    if (m?.clientId) pending.current.delete(m.clientId);
    setMessages((cur) => cur.filter((x) => x.id !== id));
  }, []);

  return { messages, staffReadAt, loading, error, hasMore, loadingOlder, progress, reload, loadOlder, send, retry, discard, staffTyping, notifyTyping };
}

/**
 * Số tin nhân viên chưa đọc (chấm ở Trang chủ): tải khi màn được mở lại + nghe realtime `chatv:<key>` – nhân viên trả lời
 * (`new`) hoặc khách đã đọc ở thiết bị khác (`read`) → tải lại ngay. Lỗi → 0 (không chặn Trang chủ).
 */
export function useChatUnread(): number {
  const [count, setCount] = useState(0);
  const [key, setKey] = useState<string | null>(null);
  const req = useRef(0);
  const load = useCallback(() => {
    const id = ++req.current;
    getChatThread({ limit: 1 })
      .then((t) => {
        if (id !== req.current) return;
        setCount(t.unread);
        setKey(t.channelKey);
      })
      .catch(() => id === req.current && setCount(0));
  }, []);
  useFocusEffect(useCallback(() => load(), [load]));
  useEffect(() => {
    if (!key) return;
    const ch = subscribeChat(key, (t) => t !== 'typing' && load(), () => undefined);
    return () => ch.close();
  }, [key, load]);
  return count;
}
