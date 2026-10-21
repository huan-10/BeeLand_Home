/**
 * Nhắn tin với chủ đầu tư — logic thuần (có test `tests/chat.test.cjs`).
 * Máy chủ (`fn_portal_app_chat_*`, cùng luật widget web): tin ≤ 4000 ký tự, ≤ 10 tệp / tin, ≤ 20 tin / phút,
 * tệp ≤ 20 MB (bucket `chat-files`), ≤ 10 tệp / 10 phút.
 */
import type { ChatAttachment, ChatMessage, NoxhFormat } from '@/types';

import { parseDate, startOfDay } from './date';
import { formatWeekdayDate } from './format';

export const CHAT_TEXT_MAX = 4000;
/** Hiện bộ đếm ký tự khi gần chạm giới hạn. */
export const CHAT_TEXT_WARN = 3500;
/** Tệp chờ gửi cùng lúc trên app (máy chủ cho 10 tệp / 10 phút). */
export const CHAT_FILES_MAX = 5;
export const CHAT_FILE_MAX_MB = 20;
/** Định dạng chọn được trên app (máy chủ nhận thêm webp / gif / zip…, bộ chọn của app giữ gọn như Yêu cầu). */
export const CHAT_FILE_FORMATS: NoxhFormat[] = ['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
/** "Đang soạn tin" của nhân viên hiện trong khoảng này sau tín hiệu cuối; khách gõ phát tối đa 1 lần / 3 s (như widget web). */
export const CHAT_TYPING_SHOW_MS = 4000;
export const CHAT_TYPING_GAP_MS = 3000;
/** Tin liền nhau của cùng một người trong khoảng này gộp thành một cụm (ẩn tên / giờ lặp lại). */
export const CHAT_GROUP_GAP_MS = 5 * 60 * 1000;

/** Câu gợi ý mở lời khi chưa có tin nào (bấm → điền vào ô soạn, khách sửa rồi gửi). */
export const CHAT_SUGGESTIONS = [
  'Tôi muốn hỏi về tiến độ thanh toán',
  'Thủ tục bàn giao căn hộ như thế nào?',
  'Tôi cần cập nhật thông tin cá nhân',
  'Hồ sơ nhà ở xã hội của tôi đến đâu rồi?',
];

const s = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function isImageMime(mime: string | null | undefined): boolean {
  return !!mime && mime.toLowerCase().startsWith('image/');
}

function toAttachment(raw: unknown): ChatAttachment | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const id = s(a.id);
  if (!id) return null;
  return { id, name: s(a.ten_tep) || 'Tệp đính kèm', mime: s(a.mime), size: n(a.kich_thuoc) ?? 0, width: n(a.rong), height: n(a.cao) };
}

/** Tin của `fn_portal_app_chat_tin` / `_gui` (dạng `_chat_v_msg_json`) → kiểu app. */
export function toChatMessage(raw: Record<string, unknown>): ChatMessage {
  const loai = s(raw.loai);
  const attachments = Array.isArray(raw.attachments) ? raw.attachments.map(toAttachment).filter((a): a is ChatAttachment => !!a) : [];
  const fromMe = s(raw.sender_type) === 'contact';
  const r = raw.reply_to && typeof raw.reply_to === 'object' ? (raw.reply_to as Record<string, unknown>) : null;
  const replyTo = r
    ? { senderName: s(r.sender_type) === 'contact' ? 'Bạn' : s(r.sender_ten) || 'Chủ đầu tư', text: s(r.noi_dung) || null }
    : null;
  return {
    id: s(raw.id),
    clientId: s(raw.client_msg_id) || null,
    from: fromMe ? 'me' : 'staff',
    senderName: fromMe ? null : s(raw.sender_ten) || null,
    senderAvatar: fromMe ? null : s(raw.sender_anh) || null,
    kind: loai === 'image' || loai === 'file' || loai === 'form_request' ? loai : 'text',
    text: s(raw.noi_dung) || null,
    replyTo,
    attachments,
    createdAt: s(raw.created_at),
    editedAt: s(raw.edited_at) || null,
    recalled: !!raw.recalled_at,
    status: 'sent',
  };
}

const time = (iso: string) => parseDate(iso).getTime();

/**
 * Gộp tin mới vào danh sách (cũ nhất trước): trùng id → thay; tin máy chủ khớp `clientId` của tin đang gửi → thay tin tạm.
 * Sắp theo thời gian tạo (tin đang gửi / lỗi giữ ở cuối theo thời điểm bấm gửi).
 */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of current) byId.set(m.id, m);
  for (const m of incoming) {
    if (m.clientId) {
      for (const [id, old] of byId) {
        if (old.id !== m.id && old.clientId === m.clientId && old.status !== 'sent') byId.delete(id);
      }
    }
    byId.set(m.id, m);
  }
  return [...byId.values()].sort((a, b) => time(a.createdAt) - time(b.createdAt) || a.id.localeCompare(b.id));
}

/** Mốc lấy tin mới: thời điểm của tin máy chủ mới nhất (bỏ tin đang gửi). */
export function latestServerTime(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && m.status === 'sent') return m.createdAt;
  }
  return null;
}

/** "Hôm nay" / "Hôm qua" / "Thứ Hai, 12/10/2026". */
export function chatDayLabel(iso: string, now: Date = new Date()): string {
  const day = startOfDay(parseDate(iso)).getTime();
  const today = startOfDay(now).getTime();
  if (day === today) return 'Hôm nay';
  if (today - day === 24 * 60 * 60 * 1000) return 'Hôm qua';
  return formatWeekdayDate(iso);
}

const pad = (v: number) => String(v).padStart(2, '0');
export function chatTimeLabel(iso: string): string {
  const d = parseDate(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type ChatRow =
  | { type: 'day'; key: string; label: string }
  | {
      type: 'message';
      key: string;
      message: ChatMessage;
      /** Tin đầu / cuối của cụm (bo góc, khoảng cách, tên, avatar). */
      first: boolean;
      last: boolean;
      /** Dòng dưới cụm: giờ (+ trạng thái với tin cuối cùng của khách). */
      footer: string | null;
    };

/** Trạng thái tin của khách: "Đang gửi…" / "Chưa gửi được" / "Đã xem" / "Đã gửi". */
export function myMessageStatus(m: ChatMessage, staffReadAt: string | null): string {
  if (m.status === 'sending') return 'Đang gửi…';
  if (m.status === 'failed') return 'Chưa gửi được';
  return staffReadAt && time(staffReadAt) >= time(m.createdAt) ? 'Đã xem' : 'Đã gửi';
}

const sameCluster = (a: ChatMessage, b: ChatMessage) =>
  a.from === b.from &&
  a.senderName === b.senderName &&
  Math.abs(time(b.createdAt) - time(a.createdAt)) <= CHAT_GROUP_GAP_MS &&
  startOfDay(parseDate(a.createdAt)).getTime() === startOfDay(parseDate(b.createdAt)).getTime();

/**
 * Dòng hiển thị (cũ nhất trước): vạch ngày + tin, đánh dấu đầu / cuối cụm. Giờ chỉ hiện dưới tin cuối cụm;
 * tin cuối cùng của khách kèm trạng thái (Đã gửi / Đã xem); tin lỗi luôn kèm "Chưa gửi được".
 */
export function chatRows(messages: ChatMessage[], staffReadAt: string | null, now: Date = new Date()): ChatRow[] {
  const rows: ChatRow[] = [];
  let lastMine = -1;
  messages.forEach((m, i) => {
    if (m.from === 'me') lastMine = i;
  });
  let prevDay = '';
  messages.forEach((m, i) => {
    const day = chatDayLabel(m.createdAt, now);
    if (day !== prevDay) {
      rows.push({ type: 'day', key: `day-${m.createdAt}`, label: day });
      prevDay = day;
    }
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const first = !prev || !sameCluster(prev, m) || chatDayLabel(prev.createdAt, now) !== day;
    const last = !next || !sameCluster(m, next) || chatDayLabel(next.createdAt, now) !== day;
    let footer: string | null = null;
    if (m.from === 'me' && (i === lastMine || m.status !== 'sent')) {
      footer = m.status === 'sent' ? `${chatTimeLabel(m.createdAt)} · ${myMessageStatus(m, staffReadAt)}` : myMessageStatus(m, staffReadAt);
    } else if (last) {
      footer = chatTimeLabel(m.createdAt);
    }
    rows.push({ type: 'message', key: m.id, message: m, first, last, footer });
  });
  return rows;
}

/** Nội dung tin hợp lệ: trả lỗi tiếng Việt hoặc null. */
export function chatTextError(text: string, files: number): string | null {
  const t = text.trim();
  if (!t && files === 0) return 'Nhập nội dung tin nhắn';
  if (t.length > CHAT_TEXT_MAX) return `Tin nhắn tối đa ${CHAT_TEXT_MAX} ký tự`;
  if (files > CHAT_FILES_MAX) return `Tối đa ${CHAT_FILES_MAX} tệp mỗi lần gửi`;
  return null;
}

/** Tên truy cập của nút nhắn tin có số chưa đọc (cụm từ đầy đủ, không đọc số trần). */
export function chatUnreadLabel(count: number): string {
  if (count <= 0) return 'Nhắn tin với chủ đầu tư';
  return `Nhắn tin với chủ đầu tư, ${count >= 99 ? 'hơn 99' : count} tin nhắn chưa đọc`;
}

/** Id ngẫu nhiên dạng UUID v4 cho `client_msg_id` (không cần độ an toàn mật mã — chỉ chống gửi trùng). */
export function newClientId(): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[8 + Math.floor(Math.random() * 4)];
    else out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}
