import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { serverClockOffset } from '@/lib/noxh';

/**
 * Đồng hồ theo giờ máy chủ: độ lệch = `server_now` − giờ máy lúc nhận dữ liệu.
 * Mọi mốc bốc thăm so theo `now()` của hook này, không theo giờ máy.
 */
export function useServerClock(serverNowIso?: string): { now: () => number } {
  const offset = useMemo(() => (serverNowIso ? serverClockOffset(serverNowIso, Date.now()) : 0), [serverNowIso]);
  const now = useCallback(() => Date.now() + offset, [offset]);
  return { now };
}

/** Nhịp vẽ lại mỗi `intervalMs` (đếm ngược); dừng khi `enabled = false` hoặc app ở nền. */
export function useTicker(enabled: boolean, intervalMs = 1000): number {
  const [tick, setTick] = useState(0);
  const [active, setActive] = useState(AppState.currentState !== 'background');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      setActive(s !== 'background');
      if (s === 'active') setTick((t) => t + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!enabled || !active) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [enabled, active, intervalMs]);

  return tick;
}

/** Vẽ lại đúng lúc chạm mốc (ví dụ giờ mở bốc thăm) để giai đoạn được tính lại ngay — không thăm dò máy chủ. */
export function useBoundaryRerender(delayMs: number | null): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (delayMs == null || delayMs < 0) return;
    // +50ms để chắc chắn đã qua mốc khi vẽ lại; setTimeout tối đa ~24,8 ngày.
    const id = setTimeout(() => setTick((t) => t + 1), Math.min(delayMs + 50, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [delayMs]);
}

/** Tới mốc → chờ ngẫu nhiên tối đa 15 giây rồi tải lại MỘT lần (không dồn mọi máy vào cùng một giây). */
const MAX_JITTER_MS = 15000;

export function useJitteredRefetch(refetch: () => Promise<void> | void): () => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return useCallback(() => {
    if (timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      void refetch();
    }, Math.random() * MAX_JITTER_MS);
  }, [refetch]);
}
