export type NotificationType = 'payment_reminder' | 'payment_overdue' | 'receipt' | 'contract' | 'project';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Thời điểm tạo, ISO 8601. */
  createdAt: string;
  read: boolean;
  /** Đường dẫn trong ứng dụng khi người dùng bấm vào thông báo. */
  link?: string;
}
