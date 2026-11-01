import { joinChannel } from './realtimeHub';

/**
 * Kênh realtime công khai `chatv:<channel_key>` của hội thoại khách (cùng kênh widget web dùng).
 * Máy chủ (`_chat_emit`) chỉ phát TÍN HIỆU không kèm nội dung: `new` / `updated` / `read` → app gọi lại
 * `fn_portal_app_chat_tin` để lấy tin. `typing`: nhân viên đang soạn (`from: 'agent'`, web / app nhân viên phát); khách gõ
 * phát `from: 'visitor'` (web BeeChat / app nhân viên hiện "Khách đang gõ…") – cùng giao thức widget web.
 * Không đăng nhập realtime (kênh public, chỉ anon key) — hub SignalR `realtimeHub.ts`.
 */
export type ChatSignal = 'new' | 'updated' | 'read' | 'typing';
const EVENTS: readonly string[] = ['new', 'updated', 'read', 'typing'];

export interface ChatChannel {
  /** Báo khách đang gõ (người gọi tự giãn cách). */
  typing: () => void;
  close: () => void;
}

/**
 * Nghe tín hiệu của một hội thoại. `onStatus(true)` khi kênh đã nối (false khi rớt / lỗi) — hook dùng để
 * bật/tắt làm mới định kỳ dự phòng và tải bù sau khi nối lại. Trang chủ và màn Nhắn tin cùng nghe một kênh: hub dùng
 * chung một lần Join (đếm tham chiếu).
 */
export function subscribeChatChannel(channelKey: string, onSignal: (t: ChatSignal) => void, onStatus: (live: boolean) => void): ChatChannel {
  const ch = joinChannel(
    `chatv:${channelKey}`,
    {},
    (event, payload) => {
      if (!EVENTS.includes(event)) return;
      // typing của chính khách (thiết bị khác) bỏ qua – chỉ nhân viên soạn tin mới hiện.
      if (event === 'typing' && (payload as { from?: unknown } | null)?.from !== 'agent') return;
      onSignal(event as ChatSignal);
    },
    onStatus,
  );
  return {
    typing: () => ch.send('typing', { t: 'typing', from: 'visitor' }),
    close: ch.close,
  };
}
