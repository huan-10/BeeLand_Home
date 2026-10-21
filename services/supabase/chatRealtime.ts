import 'react-native-url-polyfill/auto';

import { RealtimeClient, type RealtimeChannel } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';

/**
 * Kênh realtime công khai `chatv:<channel_key>` của hội thoại khách (cùng kênh widget web dùng).
 * Máy chủ (`_chat_emit`) chỉ phát TÍN HIỆU không kèm nội dung: `new` / `updated` / `read` → app gọi lại
 * `fn_portal_app_chat_tin` để lấy tin. `typing`: nhân viên đang soạn (`from: 'agent'`, web / app nhân viên phát); khách gõ
 * phát `from: 'visitor'` (web BeeChat / app nhân viên hiện "Khách đang gõ…") – cùng giao thức widget web.
 * Không đăng nhập realtime (kênh public, chỉ anon key).
 */
export type ChatSignal = 'new' | 'updated' | 'read' | 'typing';
const EVENTS: ChatSignal[] = ['new', 'updated', 'read', 'typing'];

export interface ChatChannel {
  /** Báo khách đang gõ (người gọi tự giãn cách). */
  typing: () => void;
  close: () => void;
}

let client: RealtimeClient | null = null;
function realtime(): RealtimeClient {
  if (!client) {
    client = new RealtimeClient(`${SUPABASE_URL.replace(/^http/, 'ws')}/realtime/v1`, {
      params: { apikey: SUPABASE_ANON_KEY },
    });
  }
  return client;
}

interface Shared {
  ch: RealtimeChannel;
  signal: Set<(t: ChatSignal) => void>;
  status: Set<(live: boolean) => void>;
  live: boolean;
}

/**
 * Một kênh / topic dùng chung, đếm tham chiếu: realtime-js trả LẠI kênh cũ khi gọi `channel()` cùng topic (Trang chủ và màn
 * Nhắn tin cùng nghe `chatv:<key>`) → subscribe lần hai lỗi và một nơi `removeChannel` làm nơi kia mất realtime.
 */
const shared = new Map<string, Shared>();

/**
 * Nghe tín hiệu của một hội thoại. `onStatus(true)` khi kênh đã nối (false khi rớt / lỗi) — hook dùng để
 * bật/tắt làm mới định kỳ dự phòng và tải bù sau khi nối lại.
 */
export function subscribeChatChannel(channelKey: string, onSignal: (t: ChatSignal) => void, onStatus: (live: boolean) => void): ChatChannel {
  let entry = shared.get(channelKey);
  if (!entry) {
    const rt = realtime();
    let ch = rt.channel(`chatv:${channelKey}`, { config: { broadcast: { self: false } } });
    const e: Shared = { ch, signal: new Set(), status: new Set(), live: false };
    for (const ev of EVENTS) {
      ch = ch.on('broadcast', { event: ev }, (msg: { payload?: { from?: unknown } }) => {
        // typing của chính khách (thiết bị khác) bỏ qua – chỉ nhân viên soạn tin mới hiện.
        if (ev === 'typing' && msg?.payload?.from !== 'agent') return;
        e.signal.forEach((l) => l(ev));
      });
    }
    ch.subscribe((st) => {
      e.live = st === 'SUBSCRIBED';
      e.status.forEach((l) => l(e.live));
    });
    shared.set(channelKey, e);
    entry = e;
  }
  const e = entry;
  e.signal.add(onSignal);
  e.status.add(onStatus);
  if (e.live) onStatus(true);
  let open = true;
  return {
    typing: () => {
      if (open) void e.ch.send({ type: 'broadcast', event: 'typing', payload: { t: 'typing', from: 'visitor' } });
    },
    close: () => {
      if (!open) return;
      open = false;
      e.signal.delete(onSignal);
      e.status.delete(onStatus);
      if (e.signal.size === 0) {
        shared.delete(channelKey);
        void realtime().removeChannel(e.ch);
      }
    },
  };
}
