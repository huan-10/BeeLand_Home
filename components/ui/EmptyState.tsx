import { type IconName } from '@/theme';

import { Button } from './Button';
import { StateView } from './StateView';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Trạng thái rỗng: luôn có lời giải thích và (nếu có thể) một hành động tiếp theo. */
export function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <StateView
      icon={icon}
      tone="primary"
      title={title}
      description={description}
      action={actionLabel && onAction ? <Button title={actionLabel} variant="secondary" size="sm" onPress={onAction} /> : undefined}
    />
  );
}
