import { mockChatAutoReply, mockChatRows, mockChatStaffName } from '@/data/mock/chat';
import { CHAT_FILE_FORMATS, CHAT_FILE_MAX_MB, chatTextError, toChatMessage } from '@/lib/chat';
import { NOXH_MIME, validateNoxhFile } from '@/lib/noxh';
import type { ChatAttachment, ChatMessage, ChatThread } from '@/types';

import { AUTH_BACKEND } from './config';
import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';
import type { PickedFile } from './noxhService';
import { requirePortalToken } from './session';
import { subscribeChatChannel, type ChatChannel, type ChatSignal } from './supabase/chatRealtime';
import { edge, rpc } from './supabase/client';
import { publicStorageUrl, uploadToSignedUrl } from './supabase/storage';

/**
 * Nhắn tin với chủ đầu tư — CÙNG lõi chat của web (BeeChat, kênh `app`): token phiên cổng khách hàng →
 * `fn_portal_app_chat_tin` / `fn_portal_app_chat_gui` / `fn_portal_app_chat_da_doc`; tệp qua edge `chat-app`
 * (`upload_url` → tải lên link ký vào kho riêng tư `chat-files` → gửi `attachment_ids`; `file_url` → link xem 5 phút).
 * Hội thoại tạo ở tin đầu tiên; mọi nhân viên có quyền BeeChat thấy và trả lời trên web.
 */

const BUCKET = 'chat-files';
const NOT_ENABLED = 'Tính năng nhắn tin chưa được bật trên máy chủ. Vui lòng thử lại sau.';
/** Link ký của máy chủ sống 5 phút → dùng lại trong 4 phút. */
const URL_TTL_MS = 4 * 60 * 1000;

type Envelope<T> = { data?: T; error?: string };

function unwrap<T>(res: Envelope<T> | null, fallback: string): T {
  if (res?.error) {
    const expired = /phiên đăng nhập/i.test(res.error);
    throw new ServiceError(res.error, expired ? 'UNAUTHORIZED' : 'UNKNOWN');
  }
  if (!res?.data) throw new ServiceError(fallback);
  return res.data;
}

/** Hàm / edge chưa triển khai trên máy chủ → câu cho khách. */
async function guard<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof ServiceError && /could not find the function|function .* does not exist|404/i.test(e.message)) {
      throw new ServiceError(NOT_ENABLED);
    }
    throw e;
  }
}

/** Kiểm tệp ngay trên máy (định dạng, HEIC, ≤ 20 MB) trước khi xin link tải lên. */
export function checkChatFile(file: PickedFile): string | null {
  const check = validateNoxhFile(file, CHAT_FILE_FORMATS, CHAT_FILE_MAX_MB);
  return check.ok ? null : check.message;
}

function fileMime(file: PickedFile): string {
  const check = validateNoxhFile(file, CHAT_FILE_FORMATS, CHAT_FILE_MAX_MB);
  return file.type || (check.ok ? NOXH_MIME[check.ext] : 'application/octet-stream');
}

/** Đường dẫn trong kho lấy từ link ký `…/object/upload/sign/chat-files/<path>?token=…`. */
export function signedUploadPath(url: string): string | null {
  const marker = `/object/upload/sign/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  const rest = url.slice(i + marker.length).split('?')[0] ?? '';
  return rest ? rest.split('/').map(decodeURIComponent).join('/') : null;
}

export interface ChatPage {
  after?: string | null;
  before?: string | null;
  limit?: number;
}

/* ---------------- Luồng thật ---------------- */

type RawThread = { items?: Record<string, unknown>[]; channel_key?: string | null; has_more?: boolean; nv_last_read_at?: string | null; unread?: number };

async function apiThread(page: ChatPage): Promise<ChatThread> {
  const res = await rpc<Envelope<RawThread> | null>('fn_portal_app_chat_tin', {
    p_token: requirePortalToken(),
    p_after: page.after ?? null,
    p_before: page.before ?? null,
    p_limit: page.limit ?? 50,
  });
  const d = unwrap(res, 'Không tải được tin nhắn');
  return {
    messages: (d.items ?? []).map(toChatMessage),
    hasMore: !!d.has_more,
    channelKey: d.channel_key ?? null,
    staffReadAt: d.nv_last_read_at ?? null,
    unread: typeof d.unread === 'number' ? d.unread : 0,
  };
}

async function apiSend(clientId: string, text: string, attachmentIds: string[]): Promise<ChatMessage> {
  const res = await rpc<Envelope<{ message?: Record<string, unknown> }> | null>('fn_portal_app_chat_gui', {
    p_token: requirePortalToken(),
    p_msg: { client_msg_id: clientId, noi_dung: text.trim() || null, attachment_ids: attachmentIds },
  });
  const d = unwrap(res, 'Gửi tin nhắn thất bại');
  if (!d.message) throw new ServiceError('Gửi tin nhắn thất bại');
  return toChatMessage(d.message);
}

async function apiUpload(file: PickedFile): Promise<ChatAttachment> {
  const mime = fileMime(file);
  const res = await edge<Envelope<{ attachment_id?: string; upload_url?: string; token?: string }>>('chat-app', {
    action: 'upload_url',
    token: requirePortalToken(),
    ten_tep: file.name,
    mime,
    kich_thuoc: file.size,
  });
  const d = unwrap(res, 'Không tạo được liên kết tải lên');
  const path = signedUploadPath(String(d.upload_url ?? ''));
  if (!d.attachment_id || !d.token || !path) throw new ServiceError('Không tạo được liên kết tải lên');
  await uploadToSignedUrl(BUCKET, path, d.token, { ...file, type: mime });
  return { id: d.attachment_id, name: file.name, mime, size: file.size, width: null, height: null, localUri: file.uri };
}

const urlCache = new Map<string, { url: string; at: number }>();

async function apiFileUrl(attachmentId: string): Promise<string> {
  const hit = urlCache.get(attachmentId);
  if (hit && Date.now() - hit.at < URL_TTL_MS) return hit.url;
  const res = await edge<Envelope<{ url?: string }>>('chat-app', { action: 'file_url', token: requirePortalToken(), attachment_id: attachmentId });
  const url = publicStorageUrl(String(unwrap(res, 'Không mở được tệp').url ?? ''));
  if (!/^https?:\/\//i.test(url)) throw new ServiceError('Không mở được tệp');
  urlCache.set(attachmentId, { url, at: Date.now() });
  return url;
}

/* ---------------- Dữ liệu giả ---------------- */

let mockStore = clone(mockChatRows);
let mockSeq = 0;
const mockListeners = new Set<(t: ChatSignal) => void>();
let mockStaffReadAt: string | null = '2026-10-11T02:17:00.000Z';
let mockReadAt: string | null = null;

function mockThread(page: ChatPage): ChatThread {
  const all = mockStore.map(toChatMessage);
  const items = page.after ? all.filter((m) => m.createdAt > (page.after as string)) : all;
  const unread = all.filter((m) => m.from === 'staff' && (!mockReadAt || m.createdAt > mockReadAt)).length;
  return { messages: items, hasMore: false, channelKey: 'mock', staffReadAt: mockStaffReadAt, unread };
}

/* ---------------- API cho màn hình ---------------- */

/** Tin của khách đang đăng nhập (cũ nhất trước). `after`: chỉ tin mới hơn; `before`: trang cũ hơn. */
export async function getChatThread(page: ChatPage = {}): Promise<ChatThread> {
  if (AUTH_BACKEND === 'api') return guard(() => apiThread(page));
  await simulateLatency(150, 300);
  return mockThread(page);
}

/** Số tin nhân viên khách chưa đọc (chấm trên nút nhắn tin ở Trang chủ). */
export async function getChatUnread(): Promise<number> {
  return (await getChatThread({ limit: 1 })).unread;
}

/** Gửi tin (`clientId` giữ nguyên khi gửi lại → máy chủ không tạo tin trùng). */
export async function sendChatMessage(clientId: string, text: string, attachmentIds: string[] = []): Promise<ChatMessage> {
  const err = chatTextError(text, attachmentIds.length);
  if (err) throw new ServiceError(err);
  if (AUTH_BACKEND === 'api') return guard(() => apiSend(clientId, text, attachmentIds));
  await simulateLatency(200, 400);
  const now = new Date().toISOString();
  const row = {
    id: `mock-me-${++mockSeq}`,
    sender_type: 'contact',
    loai: attachmentIds.length ? 'file' : 'text',
    noi_dung: text.trim() || null,
    attachments: attachmentIds.map((id) => ({ id, ten_tep: 'Tệp đính kèm', mime: 'application/pdf', kich_thuoc: 0 })),
    created_at: now,
    client_msg_id: clientId,
  };
  mockStore = [...mockStore, row];
  // Bản xem thử: nhân viên "đọc" rồi trả lời tự động sau vài giây (qua kênh giả như realtime thật).
  setTimeout(() => {
    mockStaffReadAt = new Date().toISOString();
    mockListeners.forEach((l) => l('read'));
  }, 1200);
  setTimeout(() => mockListeners.forEach((l) => l('typing')), 1500);
  setTimeout(() => {
    mockStore = [...mockStore, { id: `mock-staff-${++mockSeq}`, sender_type: 'employee', sender_ten: mockChatStaffName, loai: 'text', noi_dung: mockChatAutoReply, attachments: [], created_at: new Date().toISOString() }];
    mockListeners.forEach((l) => l('new'));
  }, 2600);
  return toChatMessage(row);
}

/** Đánh dấu khách đã đọc tới tin cuối (nhân viên thấy trên web). */
export async function markChatRead(): Promise<void> {
  if (AUTH_BACKEND === 'api') {
    await guard(async () => {
      unwrap(await rpc<Envelope<unknown> | null>('fn_portal_app_chat_da_doc', { p_token: requirePortalToken() }), 'Không cập nhật được');
    });
    return;
  }
  mockReadAt = new Date().toISOString();
}

/** Tải một tệp lên kho riêng tư, trả tệp (id máy chủ) để gửi kèm tin. */
export async function uploadChatFile(file: PickedFile): Promise<ChatAttachment> {
  const bad = checkChatFile(file);
  if (bad) throw new ServiceError(`${file.name}: ${bad}`);
  if (AUTH_BACKEND === 'api') return guard(() => apiUpload(file));
  await simulateLatency(300, 600);
  return { id: `mock-file-${++mockSeq}`, name: file.name, mime: fileMime(file), size: file.size, width: null, height: null, localUri: file.uri };
}

/** Link xem tệp (5 phút) — chỉ tệp trong hội thoại của chính khách. Bản xem thử: rỗng. */
export async function getChatFileUrl(attachmentId: string): Promise<string> {
  if (AUTH_BACKEND === 'api') return guard(() => apiFileUrl(attachmentId));
  await simulateLatency(100, 200);
  return '';
}

/**
 * Push tin nhắn (beeland migration 20261013150000_chat_push): gắn máy này với hồ sơ khách ở mọi công ty trong phiên
 * (`sessionTokens` = token phiên cổng từng công ty) — thay toàn bộ đăng ký cũ của máy. Bản xem thử: bỏ qua.
 */
export async function registerChatPush(pushToken: string, platform: 'ios' | 'android', sessionTokens: string[]): Promise<void> {
  if (AUTH_BACKEND !== 'api' || sessionTokens.length === 0) return;
  await guard(async () => {
    unwrap(
      await rpc<Envelope<unknown> | null>('fn_portal_app_push_dang_ky', { p_tokens: sessionTokens, p_push_token: pushToken, p_nen_tang: platform }),
      'Không đăng ký được thông báo',
    );
  });
}

/** Đăng xuất: gỡ máy khỏi nhận push của khách. */
export async function unregisterChatPush(pushToken: string): Promise<void> {
  if (AUTH_BACKEND !== 'api') return;
  await guard(async () => {
    unwrap(await rpc<Envelope<unknown> | null>('fn_portal_app_push_huy', { p_push_token: pushToken }), 'Không huỷ được thông báo');
  });
}

/** Nghe tín hiệu realtime của hội thoại (`channelKey` từ `getChatThread`): `typing()` báo khách đang gõ, `close()` huỷ. */
export function subscribeChat(channelKey: string, onSignal: (t: ChatSignal) => void, onStatus: (live: boolean) => void): ChatChannel {
  if (AUTH_BACKEND === 'api') return subscribeChatChannel(channelKey, onSignal, onStatus);
  mockListeners.add(onSignal);
  onStatus(true);
  return {
    typing: () => undefined,
    close: () => {
      mockListeners.delete(onSignal);
    },
  };
}

export type { ChatChannel, ChatSignal };
