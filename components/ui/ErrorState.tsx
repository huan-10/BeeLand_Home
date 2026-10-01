import { Button } from './Button';
import { StateView } from './StateView';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Trạng thái lỗi: nêu nguyên nhân và luôn có đường khôi phục (Thử lại). */
export function ErrorState({
  title = 'Không thể tải dữ liệu',
  message = 'Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.',
  onRetry,
}: ErrorStateProps) {
  return (
    <StateView
      icon="offline"
      tone="danger"
      title={title}
      description={message}
      role="alert"
      action={onRetry ? <Button title="Thử lại" leftIcon="refresh" variant="secondary" size="sm" onPress={onRetry} /> : undefined}
    />
  );
}
