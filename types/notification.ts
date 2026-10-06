export type NotificationType =
  | 'payment_reminder'
  | 'payment_overdue'
  | 'receipt'
  | 'contract'
  | 'project'
  /** Nhà ở xã hội: lịch bốc thăm · kết quả bốc thăm · huỷ đợt bốc thăm. */
  | 'noxh_lottery'
  | 'noxh_result'
  | 'noxh_cancel';

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
