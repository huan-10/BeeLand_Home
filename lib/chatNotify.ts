/**
 * Thông báo tin nhắn của chủ đầu tư — logic thuần (test `tests/chat-notify.test.cjs`).
 * Nguồn banner trong app: (1) realtime `chatv:<key>` báo `new` → app tải tin cuối; (2) push nhận lúc app đang mở
 * (máy chủ: migration beeland 20261013150000_chat_push, edge `chat-push`, data `{type:'chat', ma_ctdk, customer_id, message_id}`).
 * Hai nguồn trùng → khử theo id tin.
 */

export interface ChatBanner {
  /** id tin — khoá khử trùng. */
  key: string;
  title: string;
  body: string;
  /** Công ty / hồ sơ của tin (push từ công ty khác công ty đang xem → bấm vào thì chuyển công ty). */
  companyId: string | null;
  customerId: string | null;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const s = (v: unknown) => (typeof v === 'string' ? v : '');

/** Xem trước nội dung tin (giống máy chủ `_chat_push_noi_dung`). */
export function chatPreview(msg: { kind: string; text: string | null; attachments: { name: string }[] }): string {
  if (msg.kind === 'image') return 'Đã gửi ảnh';
  if (msg.kind === 'file') {
    const ten = msg.attachments[0]?.name?.trim();
    return ten ? `Đã gửi tệp: ${ten}` : 'Đã gửi tệp';
  }
  const t = (msg.text ?? '').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, 180) : 'Tin nhắn mới';
}

/** Banner từ tin cuối của hội thoại (sau tín hiệu realtime `new`). Chỉ tin nhân viên, chưa thu hồi. */
export function bannerFromMessage(
  msg: { id: string; from: 'me' | 'staff'; senderName: string | null; kind: string; text: string | null; attachments: { name: string }[]; recalled: boolean } | null | undefined,
  companyName: string | null | undefined,
): ChatBanner | null {
  if (!msg || !msg.id || msg.from !== 'staff' || msg.recalled) return null;
  const gui = msg.senderName?.trim() || 'Chủ đầu tư';
  return { key: msg.id, title: companyName?.trim() || 'Tin nhắn mới', body: `${gui}: ${chatPreview(msg)}`, companyId: null, customerId: null };
}

/** Banner từ push chat. */
export function bannerFromPush(content: { title?: unknown; body?: unknown; data?: unknown } | null | undefined): ChatBanner | null {
  const d = content && isObj(content.data) ? content.data : null;
  if (!d || d.type !== 'chat' || !s(d.message_id)) return null;
  return {
    key: s(d.message_id),
    title: s(content?.title) || 'Tin nhắn mới',
    body: s(content?.body),
    companyId: s(d.ma_ctdk) || null,
    customerId: s(d.customer_id) || null,
  };
}

/** Đích khi bấm push: null nếu không phải push chat. */
export function chatPushTarget(data: unknown): { companyId: string | null; customerId: string | null } | null {
  if (!isObj(data) || data.type !== 'chat') return null;
  return { companyId: s(data.ma_ctdk) || null, customerId: s(data.customer_id) || null };
}

/** Có phải chuyển công ty / hồ sơ trước khi mở màn Nhắn tin không. */
export function needsSwitch(
  target: { companyId: string | null; customerId: string | null },
  active: { companyId: string | null; customerId: string | null },
): boolean {
  if (!target.companyId) return false;
  if (target.companyId !== active.companyId) return true;
  return !!target.customerId && target.customerId !== active.customerId;
}

/** Bộ nhớ khử trùng có giới hạn: `add(key)` trả false nếu đã thấy. */
export function createSeen(limit = 200): { add: (key: string) => boolean } {
  const keys: string[] = [];
  const set = new Set<string>();
  return {
    add(key: string) {
      if (set.has(key)) return false;
      set.add(key);
      keys.push(key);
      if (keys.length > limit) set.delete(keys.shift() as string);
      return true;
    },
  };
}
