/**
 * Nhắn tin với chủ đầu tư — kênh `app` của BeeChat (web beeland "Khách hàng › BeeChat").
 * Khách gửi / đọc qua `fn_portal_app_chat_*` (token phiên cổng khách hàng), tệp qua edge `chat-app`.
 * Spec: beeland/docs/superpowers/specs/2026-10-12-chat-app-khach-design.md.
 */

export interface ChatAttachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  /** Ảnh có kích thước gốc (để giữ tỉ lệ khung xem trước). */
  width: number | null;
  height: number | null;
  /** Đang gửi: tệp còn trên máy (chưa có id máy chủ) — xem trước bằng uri cục bộ. */
  localUri?: string;
}

export type ChatSendStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  /** Id máy chủ; tin đang gửi dùng `local-<clientId>`. */
  id: string;
  /** Khách tự sinh để gửi lại không tạo tin trùng. */
  clientId: string | null;
  from: 'me' | 'staff';
  /** Họ tên nhân viên (tin của khách: null). */
  senderName: string | null;
  senderAvatar: string | null;
  /** `form_request`: nhân viên đề nghị khách cập nhật thông tin. */
  kind: 'text' | 'image' | 'file' | 'form_request';
  text: string | null;
  /** Tin được trả lời (nhân viên trả lời trích dẫn trên web / app nhân viên). */
  replyTo: { senderName: string; text: string | null } | null;
  attachments: ChatAttachment[];
  createdAt: string;
  editedAt: string | null;
  recalled: boolean;
  status: ChatSendStatus;
}

export interface ChatThread {
  /** Cũ nhất trước. */
  messages: ChatMessage[];
  hasMore: boolean;
  /** Kênh realtime công khai `chatv:<channelKey>` (null = chưa có hội thoại). */
  channelKey: string | null;
  /** Mốc nhân viên đã đọc gần nhất → "Đã xem". */
  staffReadAt: string | null;
  /** Số tin nhân viên khách chưa đọc (≤ 99). */
  unread: number;
}
