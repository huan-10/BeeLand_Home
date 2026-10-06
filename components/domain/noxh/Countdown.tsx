import { useEffect, useRef } from 'react';

import { Text, type TextProps } from '@/components/ui';
import { useTicker } from '@/hooks/useServerClock';
import { formatCountdown } from '@/lib/noxh';
import { semantic } from '@/theme';

export interface CountdownProps {
  /** Mốc đích (ms, giờ máy chủ). */
  targetMs: number;
  /** Giờ máy chủ hiện tại (`useServerClock().now`). */
  now: () => number;
  /** Gọi một lần khi chạm mốc. */
  onElapsed?: () => void;
  /** Tiền tố đọc cho trình đọc màn hình, ví dụ "Bốc thăm sau". */
  label?: string;
  variant?: TextProps['variant'];
  color?: string;
}

/** Đếm ngược theo giờ máy chủ (chữ số đều độ rộng); vẽ lại mỗi giây, dừng khi app ở nền. */
export function Countdown({ targetMs, now, onElapsed, label = 'Còn', variant = 'heading', color = semantic.text }: CountdownProps) {
  const remaining = targetMs - now();
  useTicker(remaining > 0);
  const fired = useRef(false);

  useEffect(() => {
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      onElapsed?.();
    }
    if (remaining > 0) fired.current = false;
  });

  const text = formatCountdown(remaining);
  return (
    <Text variant={variant} numeric color={color} accessibilityLabel={`${label} ${text}`}>
      {text}
    </Text>
  );
}
