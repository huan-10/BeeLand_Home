import { Redirect } from 'expo-router';

/** Phiếu thu đã gộp vào màn Thanh toán (tab "Đã thanh toán"); giữ route để liên kết cũ vẫn mở đúng. */
export default function ReceiptsRedirect() {
  return <Redirect href={{ pathname: '/payments', params: { tab: 'paid' } }} />;
}
