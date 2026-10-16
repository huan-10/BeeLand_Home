import { Redirect } from 'expo-router';

/** "Lịch bàn giao" đã gộp vào màn Bàn giao căn hộ (2026-10-16) — giữ đường dẫn cũ cho thông báo / liên kết đã gửi. */
export default function HandoverScheduleRedirect() {
  return <Redirect href="/ban-giao" />;
}
